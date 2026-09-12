import unittest
from ranking_session import RankingSession
from tests.test_matching_engine import FakeEmbedder, JD, resume


class SessionTests(unittest.TestCase):
    def setUp(self):
        self.encoder = FakeEmbedder()
        self.session = RankingSession(self.encoder)
        self.payload = {'job': JD, 'resumes': [resume('a', 'Built backend APIs'), resume('b', 'Design React')]}
        self.criteria = {'required_skills': ['React'], 'preferred_skills': []}
        self.semantic = dict(semantic=100, required_skills=0, preferred_skills=0, experience=0, projects=0)
        self.skills = dict(semantic=0, required_skills=100, preferred_skills=0, experience=0, projects=0)

    def test_live_handoff_without_reencoding(self):
        original = self.session.evaluate(self.payload, self.criteria, self.semantic)
        self.assertEqual(original[0]['candidate_id'], 'a')
        changed = self.session.set_weights(self.skills)
        self.assertEqual(changed[0]['candidate_id'], 'b')
        self.assertEqual(changed[0]['rank_change'], 1)
        self.assertEqual(self.encoder.calls, 1)
        self.assertEqual(original[0]['candidate_id'], 'a')
        changed[0]['dimension_scores']['semantic'] = -100
        self.assertGreaterEqual(self.session.results[0]['dimension_scores']['semantic'], 0)

    def test_invalid_weights_preserve_previous(self):
        previous = self.session.evaluate(self.payload, self.criteria)
        with self.assertRaises(ValueError):
            self.session.set_weights(dict.fromkeys(self.skills, 0))
        self.assertEqual(previous, self.session.results)

    def test_failed_new_input_clears_old_ranking(self):
        self.session.evaluate(self.payload, self.criteria)
        with self.assertRaises(ValueError):
            self.session.evaluate({}, self.criteria)
        self.assertIsNone(self.session.results)
        with self.assertRaises(ValueError):
            self.session.set_weights(self.skills)

    def test_changed_criteria_recomputes(self):
        first = self.session.evaluate(self.payload, self.criteria, self.skills)
        second = self.session.evaluate(self.payload, {'required_skills': ['REST APIs']}, self.skills)
        self.assertEqual(self.encoder.calls, 2)
        self.assertNotEqual(first[0]['skill_matches'][0]['skill'], second[0]['skill_matches'][0]['skill'])
        self.assertTrue(all(r['previous_rank'] is None for r in second))


if __name__ == '__main__':
    unittest.main()
