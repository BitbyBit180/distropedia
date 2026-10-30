/**
 * Guest verification probe.
 *
 * The rule targets in the curriculum are ordinary shell commands and paths, so the
 * honest way to grade an exercise is to re-run them inside the v86 guest and read the
 * reply back off the serial line. buildProbeScript() generates a POSIX /bin/sh script
 * that prints a marker-delimited block per item; parseProbeEvidence() turns that block
 * into the evidence object the Django evaluator (apps/learning/services.py) expects.
 */

const FILE_RULES = ['file_exists', 'file_not_exists', 'file_contains'];
const COMMAND_RULES = ['command_exit_zero', 'output_matches'];
const ENV_RULES = ['env_var_equals'];

const PROBE_END = 'DPE-DONE';

const shq = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const uniqueTargets = (rules, types) => {
  const seen = [];
  for (const rule of rules) {
    if (!types.includes(rule.rule_type)) continue;
    const target = rule.target || '';
    if (target && !seen.includes(target)) seen.push(target);
  }
  return seen;
};

export function buildProbeScript(rules = []) {
  const files = uniqueTargets(rules, FILE_RULES);
  const commands = uniqueTargets(rules, COMMAND_RULES);
  const envVars = uniqueTargets(rules, ENV_RULES);

  if (!files.length && !commands.length && !envVars.length) return null;

  // One script, run top to bottom in a single shell, so state an earlier rule
  // establishes (an alias, a cd) is still visible to a later one.
  const body = ['#!/bin/sh'];

  files.forEach((path, i) => {
    body.push(`printf 'DP|F|${i}|X='`);
    body.push(`if [ -e ${shq(path)} ]; then echo 1; else echo 0; fi`);
    body.push(`printf 'DP|F|${i}|D\\n'`);
    body.push(`head -c 4000 ${shq(path)} 2>/dev/null`);
    body.push(`printf '\\nDP|F|${i}|E\\n'`);
  });

  commands.forEach((cmd, i) => {
    body.push(`${cmd} > /tmp/dp.out 2>&1`);
    body.push(`printf 'DP|C|${i}|X=%s\\n' "$?"`);
    body.push(`printf 'DP|C|${i}|D\\n'`);
    body.push(`cat /tmp/dp.out 2>/dev/null`);
    body.push(`printf '\\nDP|C|${i}|E\\n'`);
  });

  envVars.forEach((name, i) => {
    body.push(`printf 'DP|E|${i}|D\\n'`);
    body.push(`printenv ${shq(name)} 2>/dev/null`);
    body.push(`printf '\\nDP|E|${i}|E\\n'`);
  });

  return [
    `cat > /tmp/dp.sh << 'DPRO'`,
    ...body,
    'DPRO',
    'sh /tmp/dp.sh',
    `echo ${PROBE_END}`,
    '',
  ].join('\n');
}

const blockOf = (text, kind, index) => {
  const startTag = `DP|${kind}|${index}|D\n`;
  const endTag = `\nDP|${kind}|${index}|E\n`;
  const from = text.lastIndexOf(startTag);
  if (from === -1) return null;
  const begin = from + startTag.length;
  const to = text.indexOf(endTag, begin);
  if (to === -1) return null;
  return text.slice(begin, to);
};

const flagOf = (text, kind, index) => {
  // The probe script is echoed back by the guest tty, so the first match is the echo.
  const re = new RegExp(`DP\\|${kind}\\|${index}\\|X=([^\\n]*)`, 'g');
  let match = null;
  let last = null;
  while ((match = re.exec(text)) !== null) last = match[1].trim();
  return last;
};

export function parseProbeEvidence(raw, rules = []) {
  const files = uniqueTargets(rules, FILE_RULES);
  const commands = uniqueTargets(rules, COMMAND_RULES);
  const envVars = uniqueTargets(rules, ENV_RULES);

  const evidence = { files: {}, commands: {}, env: {} };

  files.forEach((path, i) => {
    const exists = flagOf(raw, 'F', i) === '1';
    evidence.files[path] = { exists, content: blockOf(raw, 'F', i) || '' };
  });

  commands.forEach((cmd, i) => {
    const exit = flagOf(raw, 'C', i);
    const output = blockOf(raw, 'C', i);
    if (output === null && exit === null) return;
    evidence.commands[cmd] = {
      exit_code: exit === null ? null : Number(exit),
      output: output || '',
    };
  });

  envVars.forEach((name, i) => {
    const value = blockOf(raw, 'E', i);
    if (value !== null) evidence.env[name] = value.replace(/\n$/, '');
  });

  return evidence;
}

export { PROBE_END };
