"""Offline, evidence-linked interview prompts; no generation model or API key."""
import argparse
import json
from pathlib import Path


def generate_interview_questions(result, max_questions=8):
    """Build clarification prompts from one evaluate_candidates result.

    Missing evidence is not missing ability. Explicit matches receive a depth
    question, not a suspicion flag. Input and ranking scores are never changed.
    """
    if isinstance(max_questions, bool) or not isinstance(max_questions, int) or max_questions < 1:
        raise ValueError('max_questions must be a positive integer.')
    if result.get('parse_status') != 'ok':
        return {'candidate_id': result['candidate_id'], 'status': 'needs_extraction_review',
                'message': 'Review resume extraction before generating interview questions.',
                'questions': []}
    questions = []
    seen = set()
    matches = sorted(result.get('skill_matches', []), key=lambda row: (
        row['group'] != 'required',
        {'not_found': 0, 'inferred': 1, 'explicit': 2}.get(row['status'], 3)))
    for row in matches:
        skill, status = row['skill'], row['status']
        if skill.casefold() in seen or status not in ('not_found', 'inferred', 'explicit'):
            continue
        seen.add(skill.casefold())
        if status == 'not_found':
            category = 'missing_evidence'
            reason = f'No supporting evidence for {skill} was found in the extracted resume.'
            question = (f'Have you used {skill} in work, coursework, or a personal project? '
                        'If so, describe a specific example and your contribution; '
                        'if not, what related experience do you have?')
        elif status == 'inferred':
            category = 'inferred_skill'
            reason = f"{skill} was inferred from {row['observed_skill']}; direct use needs clarification."
            question = (f"Your resume mentions {row['observed_skill']}. Did that involve using {skill} directly? "
                        'Please explain what you personally implemented and one challenge you handled.')
        else:
            category = 'skill_depth'
            reason = f'{skill} is explicitly mentioned; the match alone does not verify proficiency.'
            question = (f'For {skill}, describe a specific task you personally completed. '
                        'What decisions did you make, how did you test your work, and what was the outcome?')
        questions.append({'category': category, 'skill': skill, 'group': row['group'],
                          'reason': reason, 'question': question,
                          'evidence': row.get('evidence'), 'page': row.get('page'),
                          'follow_up': 'Which parts did you own, and which were handled by teammates or guided by a tutorial?'})
    return {'candidate_id': result['candidate_id'], 'status': 'ready',
            'questions': questions[:max_questions]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, help='Ranking JSON list')
    parser.add_argument('--output', required=True)
    parser.add_argument('--max-questions', type=int, default=8)
    args = parser.parse_args()
    results = json.loads(Path(args.input).read_text(encoding='utf-8-sig'))
    plans = [generate_interview_questions(row, args.max_questions) for row in results]
    Path(args.output).write_text(json.dumps(plans, indent=2, ensure_ascii=False), encoding='utf-8')


if __name__ == '__main__':
    main()
