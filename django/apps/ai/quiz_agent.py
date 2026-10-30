"""QUIZ agent — turns "Find Your Distro" quiz answers into a single ranked
verdict. The recommendation is FULLY AI: Jev (TypeSafe System One) makes ONE
Choice judgment over the whole catalogue — winner — and code derives everything
else from its probability distribution:

- runners-up = 2nd/3rd most probable options (no second model call)
- explanation/strengths/tip = composed in code from the catalogue facts and the
  user's own answers (Jev returns typed judgments, not prose)

There is no scoring table anywhere. Contract: the controller passes the user's
readable Q&A and the distro catalogue. We return:
{ winner, runnersUp[2], probabilities, confidence, topProbability,
  explanation, strengths, tip, model }.
"""

from apps.ai.jev_client import system_one

# Below this top-probability the pick is barely above uniform noise across the
# 14 options — let the controller report "unsure" instead of guessing.
MIN_TOP_PROBABILITY = 0.15

# One concrete, factual first step per distro (shown as "First step: …").
FIRST_STEP_TIPS = {
    "ubuntu": "Flash the Ubuntu ISO with Balena Etcher, boot it, and follow the guided installer.",
    "mint": "Boot the Mint ISO and tick “install multimedia codecs” during setup.",
    "zorin": "Boot the Zorin ISO and pick your desktop layout on first boot.",
    "popos": "Flash the Pop!_OS ISO (NVIDIA build for NVIDIA GPUs) and encrypt the disk at install.",
    "manjaro": "Boot the Manjaro ISO with non-free drivers selected for NVIDIA hardware.",
    "fedora": "Write the Fedora Workstation ISO with Fedora Media Writer, then enable RPM Fusion.",
    "arch": "Boot the Arch ISO, connect with iwctl on Wi-Fi, then run the archinstall script.",
    "opensuse": "Boot the openSUSE Tumbleweed ISO and keep snapper snapshots enabled during partitioning.",
    "debian": "Boot the Debian netinst ISO with non-free firmware included for Wi-Fi support.",
    "gentoo": "Boot the Gentoo minimal ISO, follow the handbook, and set aside a full afternoon.",
    "nixos": "Boot the NixOS graphical ISO and declare your system in /etc/nixos/configuration.nix.",
    "void": "Boot the Void ISO (glibc flavour for Steam and proprietary apps) and run void-installer.",
    "alpine": "Boot the Alpine ISO, log in as root, and run the setup-alpine script.",
    "kali": "Flash the Kali installer ISO and choose guided encrypted LVM partitioning.",
}


def _answer_for(answers, question_id):
    for a in answers:
        if a.get("questionId") == question_id:
            return a.get("answer") or None
    return None


# 2–3 grounded sentences: who the user is (their own words) + what the winner is
# (its catalogue tagline). No invented facts — everything comes from the quiz
# answers and the catalogue.
def _build_explanation(winner_name, answers, winner_tagline):
    parts = []
    for q_id in ("device_type", "ram", "gpu", "use", "experience"):
        raw = _answer_for(answers, q_id)
        if raw and raw != "Skipped":
            clean = raw.split(" — ")[0].split(" (")[0].strip()
            if clean and clean not in parts:
                parts.append(clean)

    profile = " · ".join(parts)
    head = (
        f"Based on your hardware profile and requirements ({profile}), {winner_name} is your best match."
        if profile
        else f"{winner_name} is your best match."
    )
    tail = f" {winner_tagline}" if winner_tagline else ""
    return f"{head}{tail}"[:800]


def recommend_distro(answers=None, catalogue=None):
    answers = answers or []
    catalogue = catalogue or []
    by_id = {str(d.get("id", "")).lower(): d for d in catalogue}

    # The Choice options ARE the catalogue: id → one-line rubric for Jev.
    criteria = {
        d["id"]: f"{d.get('name')} — {d.get('tagline') or ''} | category: {d.get('category') or ''} | "
        f"desktop: {d.get('desktop') or ''} | release: {d.get('releaseModel') or ''} | min RAM: {d.get('minRam') or ''}"
        for d in catalogue
    }

    data = system_one(
        state={
            "answers": [
                {"question": a.get("question"), "answer": a.get("answer")} for a in answers
            ]
        },
        questions={
            "best_distro": {
                "type": "choice",
                "instructions": {
                    "question": "Which catalogue distro is the single best match for the user described in `answers`?",
                    "rubric": (
                        "Carefully analyze both the user's intended use case and their exact computer/laptop hardware:\n"
                        "- Low RAM (1GB-2GB) or older/low-power CPU / slow storage: Choose featherweight, lean distributions like Alpine, Void, Debian (XFCE), or Mint XFCE. Do NOT pick resource-heavy distros like Ubuntu or Fedora.\n"
                        "- Dedicated NVIDIA GPU or Laptop with hybrid graphics: Strongly favor Pop!_OS (dedicated NVIDIA ISO and hybrid graphics switcher), Linux Mint, or Ubuntu for seamless driver installation.\n"
                        "- Laptop users needing battery life, trackpad gestures, and Wi-Fi stability: Favor Pop!_OS, Fedora Workstation, or Ubuntu.\n"
                        "- Gaming with modern GPU/SSD: Favor Pop!_OS, Manjaro, or Fedora.\n"
                        "- Cybersecurity, ethical hacking, and penetration testing: Strongly favor Kali Linux.\n"
                        "- Beginners / Windows switchers wanting ease of use & familiarity: Favor Linux Mint, Zorin OS, or Ubuntu.\n"
                        "- Developers & programmers with modern hardware wanting fresh software: Favor Fedora, Arch, or openSUSE.\n"
                        "- Advanced tinkerers, minimalism, or DIY control: Favor Arch Linux, NixOS, Void Linux, or Gentoo."
                    ),
                },
                "criteria": criteria,
            }
        },
    )

    verdict = (data.get("answers") or {}).get("best_distro")
    if not verdict or verdict.get("type") != "choice" or not verdict.get("choice"):
        raise Exception("AI returned an unreadable recommendation. Please try again.")

    winner = str(verdict["choice"]).lower()
    probabilities = verdict.get("probabilities") or {}
    top_prob = probabilities.get(verdict["choice"])
    if top_prob is None:
        top_prob = probabilities.get(winner)
    top_prob = float(top_prob) if isinstance(top_prob, (int, float)) else 0.0

    # Rank every catalogue option by probability: winner first, then the next two.
    ranked = [
        {"id": str(id_).lower(), "p": float(p) if isinstance(p, (int, float)) else 0.0}
        for id_, p in probabilities.items()
    ]
    ranked = [r for r in ranked if r["id"] in by_id]
    ranked.sort(key=lambda r: -r["p"])
    if winner not in by_id:
        raise Exception("AI returned an unknown distro. Please try again.")
    if not any(r["id"] == winner for r in ranked):
        ranked.insert(0, {"id": winner, "p": top_prob})
    runners_up = [r["id"] for r in ranked if r["id"] != winner][:2]

    # Strengths are catalogue facts (taglines) — no hand-written scoring.
    strengths = {winner: by_id[winner].get("tagline") or ""}
    for id_ in runners_up:
        strengths[id_] = by_id.get(id_, {}).get("tagline") or ""

    winner_name = by_id[winner].get("name")
    confidence = verdict.get("confidence")
    return {
        "winner": winner,
        "runnersUp": runners_up,
        "probabilities": probabilities,
        "confidence": confidence if isinstance(confidence, (int, float)) else None,
        "topProbability": top_prob,
        "explanation": _build_explanation(
            winner_name, answers, by_id[winner].get("tagline") or ""
        ),
        "strengths": strengths,
        "tip": FIRST_STEP_TIPS.get(winner) or None,
        "model": data.get("model") or None,
    }
