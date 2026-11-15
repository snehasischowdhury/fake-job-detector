import logging
import warnings
from pathlib import Path
from typing import Any, Optional

import joblib

logger = logging.getLogger("fake_job_detector")


class ModelLoadError(RuntimeError):
    """Raised when the serialized ML pipeline cannot be loaded or validated."""


class ModelLoader:
    """Loads and validates the scikit-learn pipeline once at application startup."""

    def __init__(self, model_path: str) -> None:
        self.model_path = Path(model_path)
        self._model: Optional[Any] = None
        self._load_error: Optional[str] = None

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    @property
    def model(self) -> Any:
        if self._model is None:
            raise ModelLoadError(self._load_error or "Model is not loaded.")
        return self._model

    def load(self) -> Any:
        if not self.model_path.exists():
            self._load_error = f"Model file not found at {self.model_path}"
            logger.error(self._load_error)
            raise ModelLoadError(self._load_error)

        try:
            with warnings.catch_warnings(record=True) as caught_warnings:
                warnings.simplefilter("always")
                loaded = joblib.load(self.model_path)

            for warn in caught_warnings:
                logger.warning(
                    "Model load warning (%s): %s",
                    warn.category.__name__,
                    warn.message,
                )

            if not (hasattr(loaded, "predict") and hasattr(loaded, "predict_proba")):
                raise ModelLoadError(
                    "Loaded artifact does not implement predict() and predict_proba()."
                )

            self._model = loaded
            self._load_error = None
            logger.info("Successfully loaded ML pipeline from %s", self.model_path)
            return self._model
        except ModelLoadError:
            raise
        except Exception as exc:
            self._load_error = f"Failed to load ML pipeline: {exc}"
            logger.exception("Unexpected error loading model from %s", self.model_path)
            raise ModelLoadError(self._load_error) from exc
