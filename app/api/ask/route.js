import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import Question from '../../../models/Question';
import { geminiCall } from '../../../lib/gemini';

export async function POST(req) {
  await db;
  const { question } = await req.json();

  // Step 1: Ambiguity Check with required YES/NO conclusion
  const checkPrompt = `Analyze this STEM question for:
1. Ambiguity: Is it clear what's being asked?
2. Conceptual Correctness: Are the physics/math concepts valid?
3. Completeness: Are all necessary values provided?
4. Single Clear Answer: Can it yield one definitive answer?

After your analysis, you MUST end with one of these exact phrases:
"FINAL_DECISION: YES" (if the question meets all criteria)
"FINAL_DECISION: NO" (if the question has any issues)

Question: ${question}`;

  const checkResponse = await geminiCall(checkPrompt);
  
  // Check for the explicit final decision
  const hasYesDecision = checkResponse.includes("FINAL_DECISION: YES");
  const hasNoDecision = checkResponse.includes("FINAL_DECISION: NO");

  if (!hasYesDecision || hasNoDecision) {
    // If there's no YES decision or there's a NO decision, ask for edits
    await Question.create({ question, ambiguityFeedback: checkResponse });
    return NextResponse.json({ status: 'edit', feedback: checkResponse });
  }

  // Step 2: Dual Answering
  const answerPrompt = `Answer this STEM question step by step in the following format:

Given:
• [List all given values with their units]

Solution:
Step 1: [First step with equation and explanation]
$$equation1$$

Step 2: [Second step with equation and explanation]
$$equation2$$

[Continue steps as needed...]

Final Answer:
$$\\boxed{final\\_answer\\_with\\_units}$$

IMPORTANT: Every equation, including the final answer, MUST be wrapped in double dollar signs ($$...$$) for block display.

Question: ${question}`;

  const answer1 = await geminiCall(answerPrompt);
  const answer2 = await geminiCall(answerPrompt);

  // Simple semantic comparison (can be improved)
  const normalize = str => str.replace(/\s+/g, '').toLowerCase();
  if (normalize(answer1) === normalize(answer2)) {
    const answersArr = [
      { text: answer1, model: 'gemini-1' },
      { text: answer2, model: 'gemini-2' },
    ];
    await Question.create({ question, answers: answersArr });
    return NextResponse.json({ status: 'answer', answer: answer1, answers: answersArr });
  }

  // Step 3: Arbitration
  const arbPrompt = `Given the question: ${question}\nAnd two answers:\n1. ${answer1}\n2. ${answer2}\nWhich answer is more correct? Reply with '1' or '2' and explain why.`;
  const arbResponse = await geminiCall(arbPrompt);
  const chosen = arbResponse.includes('1') ? 1 : 2;
  const answersArr = [
    { text: answer1, model: 'gemini-1' },
    { text: answer2, model: 'gemini-2' },
  ];
  const finalAnswer = chosen === 1 ? answer1 : answer2;
  await Question.create({
    question,
    answers: answersArr,
    arbitration: { chosen, reason: arbResponse },
  });
  return NextResponse.json({ status: 'answer', answer: finalAnswer, arbitration: arbResponse, answers: answersArr });
} 