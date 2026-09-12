import unittest
from matching_engine import evaluate_candidates, rerank_candidates, match_skills, normalize_weights, detect_skills


class FakeEmbedder:
    """Deterministic test double, never a production semantic fallback."""
    def __init__(self):
        self.calls = 0

    def encode(self, texts):
        self.calls += 1
        return [[float('backend' in t.lower() or 'express' in t.lower()),
                 float('design' in t.lower()), 0.1] for t in texts]


def resume(identifier='r1', text='Built backend APIs with Express and PostgreSQL.', **sections):
    return dict(id=identifier, filename=identifier+'.pdf',
                pages=[dict(page=1, text=text)], fullText=text, sections=sections)


JD = dict(id='j1', fullText='Build backend APIs', sections={'responsibilities': 'Build backend APIs'})


class MatchingTests(unittest.TestCase):
    def test_directional_one_hop(self):
        rows = match_skills(resume(), ['Node.js', 'JavaScript', 'SQL', 'MongoDB'], [])
        self.assertEqual([r['credit'] for r in rows], [0.7, 0, 0.7, 0])
        self.assertEqual(rows[0]['page'], 1)
        self.assertIn(rows[0]['evidence'], resume()['fullText'])
        self.assertEqual(match_skills(resume(text='SQL and REST'), ['PostgreSQL', 'Node.js'], [])[0]['credit'], 0)
        self.assertEqual(match_skills(resume(text='SQL and REST'), ['PostgreSQL', 'Node.js'], [])[1]['credit'], 0)

    def test_alias_and_no_keyword_stuffing(self):
        rows = evaluate_candidates(JD, [resume(text='NodeJS NodeJS NodeJS')],
                                   ['Node.js', 'nodejs'], [], embedder=FakeEmbedder())
        self.assertEqual(rows[0]['dimension_scores']['required_skills'], 100)
        self.assertEqual(len(rows[0]['skill_matches']), 1)

    def test_explicit_beats_inferred(self):
        rows = match_skills(resume(text='Express and Node.js'), ['Node.js'], [])
        self.assertEqual(rows[0]['status'], 'explicit')

    def test_negation_and_boundaries(self):
        self.assertNotIn('Docker', detect_skills(resume(text='No Docker experience.')))
        self.assertNotIn('Java', detect_skills(resume(text='JavaScript developer')))
        self.assertIn('C++', detect_skills(resume(text='C++ developer')))

    def test_reranking_and_no_model_calls(self):
        encoder = FakeEmbedder()
        results = evaluate_candidates(JD, [resume('a', 'Built backend APIs'),
                                           resume('b', 'Design in React')], ['React'], [], embedder=encoder)
        semantic = dict(semantic=100, required_skills=0, preferred_skills=0, experience=0, projects=0)
        skills = dict(semantic=0, required_skills=100, preferred_skills=0, experience=0, projects=0)
        first = rerank_candidates(results, semantic)
        second = rerank_candidates(first, skills)
        self.assertEqual(first[0]['candidate_id'], 'a')
        self.assertEqual(second[0]['candidate_id'], 'b')
        self.assertEqual(second[0]['rank_change'], 1)
        self.assertEqual(encoder.calls, 1)
        self.assertAlmostEqual(sum(second[0]['score_contributions'].values()), second[0]['final_score'])

    def test_missing_sections_and_empty_files(self):
        rows = evaluate_candidates(JD, [resume('empty', ''), resume('ok')], ['Node.js'], [], embedder=FakeEmbedder())
        self.assertEqual(rows[0]['dimension_scores']['experience'], 0)
        self.assertTrue(rows[0]['warnings'])
        self.assertIsNone(rows[1]['rank'])
        self.assertIsNone(rows[1]['final_score'])
        self.assertEqual(rows[1]['parse_status'], 'empty_text')

    def test_weight_validation(self):
        for value in (-1, float('nan'), float('inf'), True):
            with self.assertRaises(ValueError):
                normalize_weights({'semantic': value})
        with self.assertRaises(ValueError):
            normalize_weights(dict.fromkeys(normalize_weights(), 0))
        weights = normalize_weights(inactive_dimensions=['preferred_skills'])
        self.assertEqual(weights['preferred_skills'], 0)
        self.assertAlmostEqual(sum(weights.values()), 1)

    def test_ties_ids_and_required_precedence(self):
        rows = evaluate_candidates(JD, [resume('b'), resume('a')], ['Node.js'], ['NodeJS'], embedder=FakeEmbedder())
        self.assertEqual([r['candidate_id'] for r in rows], ['a', 'b'])
        self.assertEqual(len(rows[0]['skill_matches']), 1)
        with self.assertRaises(ValueError):
            evaluate_candidates(JD, [resume(), resume()], [], [], embedder=FakeEmbedder())

    def test_jd_fallback_and_fulltext(self):
        r = dict(id='r', fullText='backend project', sections={'projects': 'backend project'})
        rows = evaluate_candidates(dict(sections={'requirements': 'backend'}), [r], [], [], embedder=FakeEmbedder())
        self.assertGreater(rows[0]['dimension_scores']['projects'], 0)
        self.assertIsNone(rows[0]['dimension_evidence']['projects'][0]['page'])
        with self.assertRaises(ValueError):
            evaluate_candidates({}, [r], [], [], embedder=FakeEmbedder())

    def test_batch_and_json_serializable(self):
        import json
        rows = evaluate_candidates(JD, [resume(str(i)) for i in range(18)], ['Node.js'], [], embedder=FakeEmbedder())
        self.assertEqual(len(rows), 18)
        json.dumps(rows, allow_nan=False)


if __name__ == '__main__':
    unittest.main()
