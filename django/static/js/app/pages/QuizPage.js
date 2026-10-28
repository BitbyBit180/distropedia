import React, { useEffect, useMemo, useState } from "dp/core/react.js";
import { motion } from "dp/core/motion.js";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  RotateCcw,
  GitCompareArrows,
  MessagesSquare,
  Sparkles
} from "dp/core/icons.js";
import Navbar from "../components/Navbar.js";
import { QuizResultSkeleton } from "../components/Skeleton.js";
import { useDistros } from "../hooks/useDistros.js";
import { QUIZ_QUESTIONS } from "../utils/distroQuiz.js";
import { getAiRecommendation } from "../services/quizApi.js";
import { THEME, LINE, LINE_SOFT, MONO } from "../theme/designTokens.js";
function QuizPage({ onNavigate }) {
  const { distros } = useDistros();
  const distroMap = useMemo(
    () => Object.fromEntries(distros.map((d) => [d.id, d])),
    [distros]
  );
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const total = QUIZ_QUESTIONS.length;
  const done = step >= total;
  const [aiState, setAiState] = useState({ status: "idle", verdict: null, message: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    setAiState({ status: "deciding", verdict: null, message: null });
    const readable = QUIZ_QUESTIONS.map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: q.options[answers[q.id]]?.label || "Skipped"
    }));
    getAiRecommendation({ answers: readable }).then((json) => {
      if (cancelled) return;
      if (json?.ai && json?.winner) {
        setAiState({ status: "ready", verdict: json, message: null });
      } else {
        setAiState({
          status: "error",
          verdict: null,
          message: json?.message || "The AI could not decide. Please try again."
        });
      }
    }).catch((err) => {
      if (!cancelled) {
        setAiState({
          status: "error",
          verdict: null,
          message: err?.message || "Could not reach the AI. Please try again."
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [done, attempt]);
  const aiVerdict = aiState.status === "ready" && aiState.verdict && distroMap[aiState.verdict.winner] ? aiState.verdict : null;
  const decided = aiState.status === "ready";
  const displayRanked = useMemo(() => {
    if (!done || !aiVerdict) return [];
    const order = [aiVerdict.winner, ...aiVerdict.runnersUp || []].filter(Boolean);
    const probs = aiVerdict.probabilities || {};
    const strengths = aiVerdict.strengths || {};
    const topP = Math.max(0, ...order.map((id) => Number(probs[id]) || 0));
    return order.map((id, i) => ({
      distroId: id,
      percent: topP > 0 && probs[id] != null ? i === 0 ? 100 : Math.max(5, Math.round((Number(probs[id]) || 0) / topP * 100)) : i === 0 ? 100 : Math.max(40, 85 - i * 10),
      reasons: strengths[id] ? [strengths[id]] : []
    }));
  }, [done, aiVerdict]);
  const topDistro = displayRanked[0] ? distroMap[displayRanked[0].distroId] : null;
  const choose = (optIndex) => {
    setAnswers((prev) => ({ ...prev, [QUIZ_QUESTIONS[step].id]: optIndex }));
    setTimeout(() => setStep((s) => Math.min(s + 1, total)), 220);
  };
  const reset = () => {
    setAnswers({});
    setStep(0);
    setAttempt(0);
    setAiState({ status: "idle", verdict: null, message: null });
  };
  const retryAi = () => {
    setAttempt((a) => a + 1);
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        backgroundColor: THEME.bg,
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden"
      },
      className: "flex flex-col text-[#F0F4F8]"
    },
    /* @__PURE__ */ React.createElement("div", { className: "hero-bg fixed inset-0 z-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "grain-fine" }), /* @__PURE__ */ React.createElement("div", { className: "grain-fiber" })),
    /* @__PURE__ */ React.createElement(Navbar, { currentRoute: "/quiz", onNavigate }),
    /* @__PURE__ */ React.createElement(
      "main",
      {
        className: "relative z-10 flex-1 mx-auto w-full flex flex-col",
        style: { maxWidth: 760, padding: "110px 20px 64px" }
      },
      /* @__PURE__ */ React.createElement("div", { className: "text-center", style: { marginBottom: done ? 24 : 30 } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "flex items-center justify-center mx-auto",
          style: {
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(224, 90, 56, 0.15)",
            border: "1px solid rgba(224, 90, 56, 0.4)",
            marginBottom: 14
          }
        },
        /* @__PURE__ */ React.createElement(Compass, { size: 26, color: THEME.accent })
      ), /* @__PURE__ */ React.createElement(
        "h1",
        {
          style: {
            fontFamily: MONO,
            fontSize: "1.5rem",
            fontWeight: 800,
            color: THEME.textMain,
            margin: 0,
            letterSpacing: "0.02em"
          }
        },
        "Find Your Distro"
      ), /* @__PURE__ */ React.createElement(
        "p",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.78rem",
            color: THEME.textMuted,
            margin: "6px 0 0"
          }
        },
        done ? aiVerdict ? `Jev picked your match${typeof aiVerdict.confidence === "number" ? ` \xB7 ${Math.round(aiVerdict.confidence * 100)}% confidence` : ""}.` : aiState.status === "error" ? "The AI could not decide \u2014 check the message below." : "Jev is weighing your answers to pick your best match\u2026" : `Answer ${total} quick questions and we'll match you with the right Linux distro.`
      )),
      !done ? (
        /* ------------------------------ wizard ------------------------------ (see below) */
        null
      ) : aiState.status === "error" ? (
        /* ------------------------- AI-unavailable error ------------------------- */
        /* Fully AI means no hardcoded fallback: a failed verdict is an
           error with a retry that keeps the answers. */
        /* @__PURE__ */ React.createElement(
          motion.div,
          {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            className: "text-center",
            style: {
              borderRadius: 20,
              padding: "36px 24px",
              border: `1px solid ${LINE}`,
              background: "rgba(28, 34, 41, 0.55)"
            }
          },
          /* @__PURE__ */ React.createElement(
            "p",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.86rem",
                fontWeight: 700,
                color: THEME.textMain,
                margin: "0 0 8px"
              }
            },
            "Jev couldn't decide right now"
          ),
          /* @__PURE__ */ React.createElement(
            "p",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.74rem",
                color: THEME.textMuted,
                margin: "0 0 20px",
                lineHeight: 1.6
              }
            },
            aiState.message || "The AI recommendation is unavailable. Please try again."
          ),
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: retryAi,
              className: "inline-flex items-center transition-all",
              style: {
                gap: 7,
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#fff",
                background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 9999,
                padding: "10px 20px",
                cursor: "pointer",
                boxShadow: `0 2px 16px ${THEME.accent}55`
              }
            },
            /* @__PURE__ */ React.createElement(RotateCcw, { size: 14 }),
            "Try again"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: reset,
              className: "transition-colors",
              style: {
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: THEME.textMuted,
                background: "none",
                border: "none",
                cursor: "pointer"
              }
            },
            "Retake quiz"
          ))
        )
      ) : !decided ? (
        /* ------------------------- deciding loader ------------------------- */
        /* One decision, rendered once: the result appears only after Jev
           answers, so the user never sees a guessed ranking first. */
        /* @__PURE__ */ React.createElement(
          motion.div,
          {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 }
          },
          /* @__PURE__ */ React.createElement(QuizResultSkeleton, null)
        )
      ) : (
        /* ------------------------------ results ------------------------------ */
        /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }, aiVerdict?.explanation ? /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 16,
              border: `1px solid ${THEME.accent}55`,
              background: "rgba(224, 90, 56, 0.07)"
            }
          },
          /* @__PURE__ */ React.createElement(
            "div",
            {
              className: "flex items-center",
              style: {
                gap: 7,
                fontFamily: MONO,
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: THEME.accent,
                marginBottom: 8
              }
            },
            /* @__PURE__ */ React.createElement(Sparkles, { size: 13 }),
            "AI explains your match"
          ),
          /* @__PURE__ */ React.createElement(
            "p",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.78rem",
                color: THEME.textMain,
                margin: 0,
                lineHeight: 1.7
              }
            },
            aiVerdict.explanation
          ),
          aiVerdict.tip ? /* @__PURE__ */ React.createElement(
            "p",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.7rem",
                color: THEME.textMuted,
                margin: "10px 0 0",
                lineHeight: 1.6
              }
            },
            /* @__PURE__ */ React.createElement("span", { style: { color: THEME.accent, fontWeight: 700 } }, "First step: "),
            aiVerdict.tip
          ) : null
        ) : null, topDistro && /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "flex items-center",
            style: {
              ...{
                background: "rgba(28, 34, 41, 0.55)",
                backdropFilter: "blur(28px) saturate(170%)",
                WebkitBackdropFilter: "blur(28px) saturate(170%)",
                border: "1px solid rgba(255, 255, 255, 0.14)"
              },
              borderRadius: 20,
              padding: 20,
              gap: 16,
              marginBottom: 16,
              borderColor: `${THEME.accent}66`
            }
          },
          /* @__PURE__ */ React.createElement(
            "div",
            {
              style: {
                width: 72,
                height: 72,
                borderRadius: 9999,
                background: `${topDistro.accent}22`,
                border: `1px solid ${topDistro.accent}66`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative"
              }
            },
            /* @__PURE__ */ React.createElement(
              Sparkles,
              {
                size: 16,
                style: {
                  color: topDistro.accent,
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: THEME.bg,
                  borderRadius: 9999,
                  padding: 2
                }
              }
            ),
            /* @__PURE__ */ React.createElement(
              "span",
              {
                style: {
                  fontFamily: MONO,
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: topDistro.accent
                }
              },
              displayRanked[0].percent,
              "%"
            )
          ),
          /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(
            "div",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: THEME.textMuted
              }
            },
            "Best match"
          ), /* @__PURE__ */ React.createElement(
            "h2",
            {
              style: {
                fontFamily: MONO,
                fontSize: "1.25rem",
                fontWeight: 800,
                color: THEME.textMain,
                margin: "2px 0 4px"
              }
            },
            topDistro.name
          ), /* @__PURE__ */ React.createElement(
            "p",
            {
              style: {
                fontFamily: MONO,
                fontSize: "0.72rem",
                color: THEME.silver,
                margin: 0,
                lineHeight: 1.6
              }
            },
            topDistro.tagline
          ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap", style: { gap: 6, marginTop: 8 } }, displayRanked[0].reasons.slice(0, 3).map((r) => /* @__PURE__ */ React.createElement(
            "span",
            {
              key: r,
              style: {
                fontFamily: MONO,
                fontSize: "0.62rem",
                color: THEME.textMuted,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${LINE}`,
                borderRadius: 9999,
                padding: "2px 9px"
              }
            },
            r
          ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap", style: { gap: 10, marginTop: 12 } }, /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => onNavigate?.(`/distro/${topDistro.id}`),
              className: "inline-flex items-center transition-all",
              style: {
                gap: 6,
                fontFamily: MONO,
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "#fff",
                background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 9999,
                padding: "8px 18px",
                cursor: "pointer",
                boxShadow: `0 2px 16px ${THEME.accent}55`
              }
            },
            "View ",
            topDistro.name,
            " details \u2192"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => onNavigate?.("/flavours"),
              className: "inline-flex items-center transition-colors",
              style: {
                gap: 6,
                fontFamily: MONO,
                fontSize: "0.74rem",
                fontWeight: 700,
                color: THEME.textMuted,
                background: "none",
                border: "none",
                cursor: "pointer"
              }
            },
            "Browse all distros"
          )))
        ), displayRanked.slice(1).map((r, i) => {
          const d = distroMap[r.distroId];
          if (!d) return null;
          return /* @__PURE__ */ React.createElement(
            "div",
            {
              key: r.distroId,
              className: "flex items-center",
              style: {
                borderRadius: 14,
                padding: "12px 16px",
                gap: 14,
                marginBottom: 10,
                border: `1px solid ${LINE}`,
                background: "rgba(255,255,255,0.03)"
              }
            },
            /* @__PURE__ */ React.createElement(
              "span",
              {
                style: {
                  fontFamily: MONO,
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: THEME.textMuted,
                  minWidth: 16
                }
              },
              i + 2
            ),
            /* @__PURE__ */ React.createElement(
              "div",
              {
                style: {
                  width: 44,
                  height: 44,
                  borderRadius: 9999,
                  background: `${d.accent}22`,
                  border: `1px solid ${d.accent}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: MONO,
                  fontWeight: 800,
                  color: d.accent,
                  fontSize: "0.82rem"
                }
              },
              r.percent,
              "%"
            ),
            /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(
              "div",
              {
                style: {
                  fontFamily: MONO,
                  fontSize: "0.86rem",
                  fontWeight: 700,
                  color: THEME.textMain
                }
              },
              d.name
            ), /* @__PURE__ */ React.createElement(
              "div",
              {
                className: "flex flex-wrap",
                style: { gap: 5, marginTop: 3 }
              },
              r.reasons.slice(0, 2).map((reason) => /* @__PURE__ */ React.createElement(
                "span",
                {
                  key: reason,
                  style: {
                    fontFamily: MONO,
                    fontSize: "0.6rem",
                    color: THEME.textMuted
                  }
                },
                reason
              ))
            )),
            /* @__PURE__ */ React.createElement(
              "button",
              {
                type: "button",
                onClick: () => onNavigate?.(`/distro/${d.id}`),
                className: "transition-colors shrink-0",
                style: {
                  fontFamily: MONO,
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  color: THEME.accent,
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }
              },
              "Details \u2192"
            )
          );
        }), /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "flex flex-wrap items-center justify-center",
            style: { gap: 10, marginTop: 22 }
          },
          /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => onNavigate?.(`/compare?ids=${displayRanked.map((r) => r.distroId).join(",")}`),
              className: "inline-flex items-center transition-all",
              style: {
                gap: 7,
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#fff",
                background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 9999,
                padding: "10px 20px",
                cursor: "pointer",
                boxShadow: `0 2px 16px ${THEME.accent}55`
              }
            },
            /* @__PURE__ */ React.createElement(GitCompareArrows, { size: 15 }),
            "Compare top ",
            displayRanked.length
          ),
          topDistro && /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => onNavigate?.(`/community?channel=${topDistro.id}`),
              className: "inline-flex items-center transition-colors",
              style: {
                gap: 7,
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: THEME.textMain,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${LINE_SOFT}`,
                borderRadius: 9999,
                padding: "10px 20px",
                cursor: "pointer"
              }
            },
            /* @__PURE__ */ React.createElement(MessagesSquare, { size: 15 }),
            "Join d/",
            topDistro.id === "general" ? "General" : topDistro.id
          ),
          /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: reset,
              className: "inline-flex items-center transition-colors",
              style: {
                gap: 7,
                fontFamily: MONO,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: THEME.textMuted,
                background: "none",
                border: "none",
                cursor: "pointer"
              }
            },
            /* @__PURE__ */ React.createElement(RotateCcw, { size: 14 }),
            "Retake quiz"
          )
        ))
      ),
      !done && /* ------------------------------ wizard ------------------------------ */
      /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "flex items-center justify-between",
          style: {
            fontFamily: MONO,
            fontSize: "0.66rem",
            color: THEME.textMuted,
            marginBottom: 6
          }
        },
        /* @__PURE__ */ React.createElement("span", null, "Question ", step + 1, " of ", total),
        /* @__PURE__ */ React.createElement("span", null, Math.round(step / total * 100), "%")
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            height: 4,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.07)",
            overflow: "hidden"
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              height: "100%",
              width: `${step / total * 100}%`,
              background: `linear-gradient(90deg, ${THEME.accent}, #b83d25)`,
              borderRadius: 9999,
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }
          }
        )
      )), /* @__PURE__ */ React.createElement(
        motion.div,
        {
          key: step,
          initial: { opacity: 0, x: 24 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.22 }
        },
        /* @__PURE__ */ React.createElement(
          "h2",
          {
            style: {
              fontFamily: MONO,
              fontSize: "1.05rem",
              fontWeight: 800,
              color: THEME.textMain,
              margin: "0 0 14px"
            }
          },
          QUIZ_QUESTIONS[step].question
        ),
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } }, QUIZ_QUESTIONS[step].options.map((opt, i) => {
          const chosen = answers[QUIZ_QUESTIONS[step].id] === i;
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: opt.label,
              type: "button",
              onClick: () => choose(i),
              className: "flex items-center transition-all",
              style: {
                gap: 12,
                textAlign: "left",
                background: chosen ? "rgba(224, 90, 56, 0.12)" : "rgba(28, 34, 41, 0.55)",
                border: `1px solid ${chosen ? `${THEME.accent}88` : LINE}`,
                borderRadius: 12,
                padding: "13px 16px",
                cursor: "pointer",
                fontFamily: MONO,
                fontSize: "0.8rem",
                color: chosen ? THEME.textMain : "rgba(240,244,248,0.8)"
              },
              onMouseEnter: (e) => {
                if (!chosen) e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              },
              onMouseLeave: (e) => {
                if (!chosen) e.currentTarget.style.borderColor = LINE;
              }
            },
            /* @__PURE__ */ React.createElement(
              "span",
              {
                className: "flex items-center justify-center shrink-0",
                style: {
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  border: `2px solid ${chosen ? THEME.accent : "rgba(255,255,255,0.25)"}`,
                  background: chosen ? THEME.accent : "transparent"
                }
              },
              chosen && /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: 9999, background: "#fff" } })
            ),
            opt.label,
            /* @__PURE__ */ React.createElement(
              ArrowRight,
              {
                size: 13,
                className: "ml-auto shrink-0",
                style: { color: chosen ? THEME.accent : "rgba(255,255,255,0.15)" }
              }
            )
          );
        })),
        step > 0 && /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setStep((s) => Math.max(0, s - 1)),
            className: "inline-flex items-center transition-colors",
            style: {
              gap: 6,
              marginTop: 18,
              fontFamily: MONO,
              fontSize: "0.72rem",
              fontWeight: 700,
              color: THEME.textMuted,
              background: "none",
              border: "none",
              cursor: "pointer"
            }
          },
          /* @__PURE__ */ React.createElement(ArrowLeft, { size: 13 }),
          "Previous question"
        )
      ))
    )
  );
}
export {
  QuizPage as default
};
