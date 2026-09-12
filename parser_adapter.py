"""Normalize both versions of Person 1's parser contract without modifying input."""

def normalize_document(document):
    if not isinstance(document, dict):
        raise ValueError('Each parsed document must be a JSON object.')
    if document.get('status') not in (None, 'success', 'ok'):
        raise ValueError('Parser reported a failed document: ' + str(document.get('error') or document.get('filename') or 'unknown file'))
    if 'data' in document:
        document = document['data']
        if not isinstance(document, dict):
            raise ValueError('Parser data must be a document object.')
        if document.get('status') not in (None, 'success', 'ok'):
            raise ValueError('Parser reported a failed document: ' + str(document.get('error') or document.get('filename') or 'unknown file'))
    normalized = dict(document)
    normalized['fullText'] = document.get('fullText') or document.get('full_text') or ''
    sections = document.get('sections') or {}
    if not isinstance(sections, dict):
        raise ValueError('Document sections must be an object.')
    normalized['sections'] = {}
    for name, section in sections.items():
        text = section.get('text', '') if isinstance(section, dict) else section
        if text is not None and not isinstance(text, str):
            raise ValueError('Section text must be a string: ' + name)
        normalized['sections'][name] = text or ''
    return normalized


def unpack_combined(payload):
    if not isinstance(payload, dict) or 'job' not in payload or not isinstance(payload.get('resumes'), list):
        raise ValueError('Combined JSON must contain a job object and a resumes list.')
    return normalize_document(payload['job']), [normalize_document(r) for r in payload['resumes']]
