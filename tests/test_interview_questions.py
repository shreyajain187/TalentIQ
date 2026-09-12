import copy
import unittest

from interview_questions import generate_interview_questions
from ranking_session import RankingSession
from tests.test_matching_engine import FakeEmbedder, JD, resume


class InterviewQuestionTests(unittest.TestCase):
    def test_evidence_priority_and_no_mutation(self):
        result = {'candidate_id': 'a', 'parse_status': 'ok', 'skill_matches': [
            {'skill': 'Docker', 'group': 'preferred', 'status': 'not_found'},
            {'skill': 'Java', 'group': 'required', 'status': 'explicit', 'evidence': 'Java', 'page': 2},
            {'skill': 'SQL', 'group': 'required', 'status': 'inferred', 'observed_skill': 'PostgreSQL',
             'evidence': 'Built with PostgreSQL', 'page': 1},
            {'skill': 'Git', 'group': 'required', 'status': 'not_found'}]}
        before = copy.deepcopy(result)
        plan = generate_interview_questions(result)
        self.assertEqual([q['skill'] for q in plan['questions']], ['Git', 'SQL', 'Java', 'Docker'])
        self.assertIsNone(plan['questions'][0]['evidence'])
        self.assertIn('Have you used Git', plan['questions'][0]['question'])
        self.assertEqual(plan['questions'][1]['evidence'], 'Built with PostgreSQL')
        self.assertEqual(plan['questions'][1]['page'], 1)
        self.assertEqual(plan['questions'][2]['category'], 'skill_depth')
        self.assertEqual(result, before)
        self.assertEqual(len(generate_interview_questions(result, 2)['questions']), 2)

    def test_empty_extraction_is_not_a_skill_gap(self):
        plan = generate_interview_questions({'candidate_id': 'a', 'parse_status': 'empty_text'})
        self.assertEqual(plan['status'], 'needs_extraction_review')
        self.assertEqual(plan['questions'], [])

    def test_invalid_limits(self):
        for limit in [0, -1, True, 1.5, '2']:
            with self.assertRaises(ValueError):
                generate_interview_questions({}, limit)

    def test_session_isolation_and_no_extra_encoding(self):
        encoder = FakeEmbedder()
        session = RankingSession(encoder)
        with self.assertRaises(ValueError):
            session.interview_questions('a')
        session.evaluate({'job': JD, 'resumes': [resume('a', 'Built REST APIs')]},
                         {'required_skills': ['Docker']})
        calls = encoder.calls
        plan = session.interview_questions('a')
        self.assertEqual(plan['questions'][0]['category'], 'missing_evidence')
        plan['questions'].clear()
        self.assertTrue(session.interview_questions('a')['questions'])
        self.assertEqual(encoder.calls, calls)
        with self.assertRaises(ValueError):
            session.interview_questions('other')


if __name__ == '__main__':
    unittest.main()
