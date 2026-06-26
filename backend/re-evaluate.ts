import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const responses = await prisma.response.findMany({
    include: {
      question: true,
      test_attempt: {
        include: {
          test: {
            include: {
              test_questions: true
            }
          }
        }
      }
    }
  });

  let fixedCount = 0;

  for (const r of responses) {
    if (!r.question || !r.test_attempt) continue;
    
    const q = r.question;
    const answerKey: any = q.answer_key;
    const studentAnswer: any = r.answer_json;
    
    // We only care about FILL_BLANK, NUMERICAL, ASSERTION_REASON
    if (["FILL_BLANK", "NUMERICAL", "ASSERTION_REASON"].includes(q.question_type)) {
      if (answerKey?.correct_option) {
        // It's an MCQ-based question!
        const isCorrect = studentAnswer?.selected_option === answerKey?.correct_option;
        
        if (isCorrect !== r.is_correct) {
          // It was evaluated wrongly before! Let's fix it!
          const tq = r.test_attempt.test.test_questions.find(t => t.id === r.test_question_id);
          const pMarks = r.test_attempt.test.positive_marks || tq?.marks_override || q.marks || 0;
          const nMarks = r.test_attempt.test.negative_marks ?? q.negative_marks ?? 0;
          
          const marks_obtained = isCorrect ? pMarks : -nMarks;
          
          await prisma.response.update({
            where: { id: r.id },
            data: {
              is_correct: isCorrect,
              marks_obtained: marks_obtained
            }
          });
          fixedCount++;
        }
      }
    }
  }

  console.log(`Re-evaluated and fixed ${fixedCount} responses!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
