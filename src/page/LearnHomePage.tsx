import LearnLayout from '../learn/components/LearnLayout';
import LearnHome from '../learn/components/LearnHome';
import SEO from '../seo/SEO';
import { generateCurriculumJsonLd } from '../learn/seo/lessonJsonLd';
import { curriculum, getTotalLessonCount } from '../learn/data/curriculum';

export default function LearnHomePage() {
  const totalTopics = curriculum.reduce((acc, p) => acc + p.topics.length, 0);
  const jsonLd = generateCurriculumJsonLd(getTotalLessonCount(), totalTopics);

  return (
    <LearnLayout showSidebar={false}>
      <SEO
        title="Learn JavaScript - Full Interactive Curriculum & Exercises"
        description="Master modern JavaScript from scratch. 175+ beginner-friendly lessons, runnable code examples, interactive Monaco editor challenges, and concept quizzes."
        keywords={[
          'learn javascript',
          'javascript tutorial',
          'javascript course',
          'javascript practice',
          'es6',
          'web development',
          'javascript curriculum',
          'runjs learn',
        ]}
        canonical="/learn"
        ogType="website"
        jsonLd={jsonLd}
      />
      <LearnHome />
    </LearnLayout>
  );
}
