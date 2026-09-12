"""One ranking session per recruiter/UI session; no web framework required."""
from copy import deepcopy
from matching_engine import LocalEmbedder, evaluate_candidates, rerank_candidates
from parser_adapter import unpack_combined


class RankingSession:
    """Own an embedder and cached results. Do not share across recruiter sessions."""
    def __init__(self, embedder=None):
        self._embedder = embedder if embedder is not None else LocalEmbedder()
        self._results = None

    def evaluate(self, payload, criteria, weights=None):
        """Call for new parser data or changed criteria, not slider changes.

        Invalidate old results first so failed new input cannot display stale ranks.
        Return a copy: downstream explanations/UI may safely add their own fields.
        """
        self._results = None
        jd, resumes = unpack_combined(payload)
        required = criteria.get('required_skills', [])
        preferred = criteria.get('preferred_skills', [])
        if not required and not preferred:
            raise ValueError('Confirm at least one required or preferred skill before ranking.')
        self._results = evaluate_candidates(jd, resumes, required, preferred,
                                           weights, embedder=self._embedder)
        return self.results

    def set_weights(self, weights):
        """Rerank cached dimension scores; no parsing, encoding, or model calls.

        Rank movement is relative to the previous successful ranking. Invalid
        weights raise ValueError and leave the previous valid results intact.
        """
        if self._results is None:
            raise ValueError('Evaluate parsed JD/resumes before changing weights.')
        self._results = rerank_candidates(self._results, weights)
        return self.results

    @property
    def results(self):
        return deepcopy(self._results) if self._results is not None else None
