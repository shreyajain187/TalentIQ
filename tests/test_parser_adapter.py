import copy
import unittest
from parser_adapter import normalize_document, unpack_combined
from matching_engine import evaluate_candidates, match_skills
from test_matching_engine import FakeEmbedder, JD, resume


class ParserTests(unittest.TestCase):
    def test_nested_and_legacy_equivalent(self):
        legacy = resume(text='Built backend APIs with Java', experience='Built backend APIs with Java')
        nested = copy.deepcopy(legacy)
        nested['full_text'] = nested.pop('fullText')
        nested['sections'] = {k: {'text': v, 'pages': [1]} for k, v in nested['sections'].items()}
        before = copy.deepcopy(nested)
        expected = evaluate_candidates(JD, [legacy], ['Java'], [], embedder=FakeEmbedder())
        actual = evaluate_candidates(JD, [{'status': 'success', 'data': nested}], ['Java'], [], embedder=FakeEmbedder())
        self.assertEqual(expected, actual)
        self.assertEqual(nested, before)

    def test_full_text_without_pages(self):
        doc = {'id': 'x', 'full_text': 'Java backend', 'sections': {}}
        result = evaluate_candidates({'full_text': 'backend'}, [doc], ['Java'], [], embedder=FakeEmbedder())
        self.assertEqual(result[0]['dimension_scores']['required_skills'], 100)

    def test_nested_jd(self):
        jd, resumes = unpack_combined({'job': {'sections': {'responsibilities': {'text': 'backend', 'pages': [1]}}},
                                      'resumes': [{'status': 'success', 'data': resume()}]})
        self.assertEqual(jd['sections']['responsibilities'], 'backend')
        self.assertEqual(len(resumes), 1)
        with self.assertRaises(ValueError):
            unpack_combined({'job': {}, 'resumes': [{'status': 'error', 'error': 'Unreadable PDF'}]})

    def test_alternatives_credit_once(self):
        for text in ['Python', 'JavaScript', 'Python and JavaScript']:
            result = evaluate_candidates(JD, [resume(text=text)], [], ['Python|JavaScript'], embedder=FakeEmbedder())
            self.assertEqual(result[0]['dimension_scores']['preferred_skills'], 100)
            self.assertEqual(len(result[0]['skill_matches']), 1)
        rows = match_skills(resume(text='Django and JavaScript'), [], ['Python|JavaScript'])
        self.assertEqual(rows[0]['status'], 'explicit')
        self.assertEqual(rows[0]['observed_skill'], 'JavaScript')
        self.assertEqual(match_skills(resume(text='Java'), [], ['Python|JavaScript'])[0]['credit'], 0)


if __name__ == '__main__':
    unittest.main()
