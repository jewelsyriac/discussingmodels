"use client";
import { useState, useRef } from "react";
import { BlockMath, InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";

// Minimal copy icon SVG
function CopyIcon({ copied }: { copied: boolean }) {
  return copied ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 10l4 4 6-6"
        stroke="#16a34a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect
        x="7"
        y="7"
        width="9"
        height="9"
        rx="2"
        stroke="#555"
        strokeWidth="1.5"
      />
      <rect
        x="4"
        y="4"
        width="9"
        height="9"
        rx="2"
        stroke="#555"
        strokeWidth="1.5"
      />
    </svg>
  );
}

interface AskResult {
  status: "edit" | "answer";
  feedback?: string;
  answer?: string;
  arbitration?: string;
  answers?: { text: string; model: string }[];
}

function forceBoldSubheadings(text: string) {
  return text
    .replace(/(^|\n)(Given:)/gi, "$1**Given:**")
    .replace(/(^|\n)(Solution:)/gi, "$1**Solution:**")
    .replace(/(^|\n)(Step \d+:)/gi, "$1**$2**")
    .replace(/(^|\n)(Final Answer:)/gi, "$1**Final Answer:**");
}

function renderSectionWithLatex(text: string, key: number) {
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      return (
        <div key={i} className="latex-block-center">
          <BlockMath>{part.slice(2, -2)}</BlockMath>
        </div>
      );
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={i}>{part.slice(1, -1)}</InlineMath>;
    }
    return (
      <ReactMarkdown
        key={i}
        components={{
          strong: ({ node, ...props }) => (
            <strong style={{ fontWeight: 700 }} {...props} />
          ),
        }}
      >
        {part}
      </ReactMarkdown>
    );
  });
}

function renderWithLatex(text: string) {
  if (!text) return null;
  const forced = forceBoldSubheadings(text);
  const filtered = forced.replace(
    /(^|\n)\*\*Solution:\*\*\s*/gi,
    "$1"
  );

  const sectionRegex = /(\*\*[A-Za-z0-9 .#-]+:\*\*)/g;
  const parts = filtered.split(sectionRegex).filter(Boolean);

  let current: string | null = null;
  let sections: { heading: string; content: string }[] = [];
  let buffer = "";

  for (let part of parts) {
    if (sectionRegex.test(part)) {
      if (current) {
        sections.push({ heading: current, content: buffer.trim() });
        buffer = "";
      }
      current = part;
    } else {
      buffer += part;
    }
  }
  if (current) {
    sections.push({ heading: current, content: buffer.trim() });
  }

  return (
    <div>
      {sections.map((sec, i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.08em",
              color: "#222",
              marginBottom: 4,
            }}
          >
            <ReactMarkdown
              components={{
                strong: ({ node, ...props }) => (
                  <strong style={{ fontWeight: 700 }} {...props} />
                ),
              }}
            >
              {sec.heading}
            </ReactMarkdown>
          </div>
          {renderSectionWithLatex(sec.content, i)}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBoth, setShowBoth] = useState(false);
  const [copied, setCopied] = useState<{ [k: string]: boolean }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaInput = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setQuestion(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShowBoth(false);
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data: AskResult = await res.json();
    setResult(data);
    setLoading(false);
  };

  const handleAskAnother = () => {
    setQuestion("");
    setResult(null);
    setShowBoth(false);
    setCopied({});
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied((c) => ({ ...c, [key]: true }));
    setTimeout(() => setCopied((c) => ({ ...c, [key]: false })), 1200);
  };

  return (
    <main>
      <h1>Synapse STEM Machine . . .</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={handleTextareaInput}
          rows={4}
          style={{
            width: "100%",
            fontSize: 16,
            overflow: "hidden",
            resize: "none",
          }}
          placeholder="Enter your STEM question here..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Ask"}
        </button>
        {result && (
          <button
            type="button"
            onClick={handleAskAnother}
            style={{
              marginLeft: 12,
              background: "#f3f4f6",
              color: "#222",
              border: "1px solid #d1d5db",
              fontWeight: 500,
            }}
          >
            Ask another
          </button>
        )}
      </form>

      {result?.status === "edit" && (
        <div className="edit-card">
          <strong>Question needs editing:</strong>
          <div>{result.feedback && renderWithLatex(result.feedback)}</div>
        </div>
      )}

      {result?.status === "answer" && (
        <div className="answer-card">
          <div style={{ position: "relative" }}>
            {result.answer && renderWithLatex(result.answer)}

            <button
              title="Copy answer"
              onClick={() => handleCopy(result.answer ?? "", "final")}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#f3f4f6",
                border: "1.5px solid #2563eb",
                borderRadius: 8,
                cursor: "pointer",
                padding: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                zIndex: 2,
              }}
            >
              <CopyIcon copied={!!copied["final"]} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowBoth((v) => !v)}
            style={{ marginTop: 16, fontSize: 14 }}
          >
            {showBoth
              ? "Hide both model responses"
              : "Show both model responses"}
          </button>

          {showBoth && result.answers && result.answers.length >= 2 && (
            <div
              className="model-compare-card"
              style={{ display: "flex", gap: 16, marginTop: 12 }}
            >
              {/* Model 1 */}
              <div
                style={{
                  flex: 1,
                  background: "#e0e7ff",
                  border: "2px solid #6366f1",
                  borderRadius: 10,
                  padding: 12,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#3730a3",
                    marginBottom: 4,
                  }}
                >
                  Model 1:
                </div>
                {renderWithLatex(result.answers[0].text)}

                <button
                  title="Copy Model 1"
                  onClick={() =>
                    handleCopy(
                      result.answers?.[0]?.text ?? "",
                      "model1"
                    )
                  }
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "#e0e7ff",
                    border: "1.5px solid #6366f1",
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    zIndex: 2,
                  }}
                >
                  <CopyIcon copied={!!copied["model1"]} />
                </button>
              </div>

              {/* Model 2 */}
              <div
                style={{
                  flex: 1,
                  background: "#fef9c3",
                  border: "2px solid #f59e42",
                  borderRadius: 10,
                  padding: 12,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#b45309",
                    marginBottom: 4,
                  }}
                >
                  Model 2:
                </div>
                {renderWithLatex(result.answers[1].text)}

                <button
                  title="Copy Model 2"
                  onClick={() =>
                    handleCopy(
                      result.answers?.[1]?.text ?? "",
                      "model2"
                    )
                  }
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "#fef9c3",
                    border: "1.5px solid #f59e42",
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    zIndex: 2,
                  }}
                >
                  <CopyIcon copied={!!copied["model2"]} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

