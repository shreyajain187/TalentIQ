"""One-time public model download; no API key needed."""
from tempfile import TemporaryDirectory
import gc
from sentence_transformers import SentenceTransformer
from matching_engine import MODEL_PATH

if __name__ == '__main__':
    with TemporaryDirectory(prefix='person2-model-') as cache:
        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2',
                                    device='cpu', cache_folder=cache)
        model.save(str(MODEL_PATH))
        del model
        gc.collect()
    print(f'Saved offline model to {MODEL_PATH}')

