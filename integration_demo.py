"""Exercise the real Person 1 -> engine -> weight-change handoff locally."""
import argparse
import json
from pathlib import Path
from ranking_session import RankingSession


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
    "--input",
    type=Path,
    default=Path("output/parsed_data.json")
)
    parser.add_argument('--criteria', type=Path, default=Path('criteria.json'))
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    read = lambda path: json.loads(path.read_text(encoding='utf-8-sig'))
    session = RankingSession()
    initial = session.evaluate(read(args.input), read(args.criteria))
    weights = dict(semantic=25, required_skills=45, preferred_skills=10, experience=10, projects=10)
    updated = session.set_weights(weights)
    report = {
        'description': 'Actual rank movement may be zero; no order is forced.',
        'updated_weights': weights,
        'initial': initial,
        'updated': updated,
    }
    if args.output:
        args.output.write_text(json.dumps(report, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    for label, rows in [('Initial ranking', initial), ('After required-skill weight increased to 45%', updated)]:
        print(label)
        for r in rows:
            print(f"  {r['rank']}: {r['filename']} | score={r['final_score']} | movement={r['rank_change']}")


if __name__ == '__main__':
    main()
