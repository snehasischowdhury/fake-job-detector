"""
Phase 3: Reproducible Model Evaluation & Leakage-Safe Validation Script
----------------------------------------------------------------------
Evaluates the existing `models/job_detector.pkl` pipeline against
`fake_job_postings.csv.zip` without modifying or retraining the model.

Usage (from backend/ with .venv active):
    python ml_validation/evaluate_model.py --dataset ../fake_job_postings.csv.zip
"""

import argparse
import html
import re
import warnings
import zipfile
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


def clean_text(raw: object) -> str:
    if raw is None or (isinstance(raw, float) and np.isnan(raw)):
        return ""
    text = html.unescape(str(raw))
    text = _HTML_TAG_RE.sub(" ", text)
    return _WHITESPACE_RE.sub(" ", text).strip()


def build_text_series(df: pd.DataFrame) -> pd.Series:
    cols = ["title", "company_profile", "description", "requirements", "benefits"]
    cleaned_cols = [df[c].map(clean_text) for c in cols]
    combined = cleaned_cols[0]
    for s in cleaned_cols[1:]:
        combined = combined + " " + s
    return combined.str.replace(r"\s+", " ", regex=True).str.strip()


def load_dataset(dataset_path: Path) -> pd.DataFrame:
    if dataset_path.suffix == ".zip":
        with zipfile.ZipFile(dataset_path, "r") as zf:
            csv_name = zf.namelist()[0]
            with zf.open(csv_name) as f:
                return pd.read_csv(f)
    return pd.read_csv(dataset_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate job_detector.pkl")
    parser.add_argument(
        "--model",
        type=Path,
        default=Path("models/job_detector.pkl"),
        help="Path to job_detector.pkl",
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        required=True,
        help="Path to fake_job_postings.csv.zip or fake_job_postings.csv",
    )
    args = parser.parse_args()

    print("=== 1. LOADING MODEL ===")
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        pipeline = joblib.load(args.model)
    for w in caught:
        print(f"[WARNING] {w.category.__name__}: {w.message}")
    print(f"Loaded pipeline steps: {[name for name, _ in pipeline.steps]}")

    print("\n=== 2. LOADING & DEDUPLICATING DATASET ===")
    df = load_dataset(args.dataset)
    raw_count = len(df)
    dedup_cols = ["title", "company_profile", "description", "requirements"]
    df_dedup = df.drop_duplicates(subset=dedup_cols).reset_index(drop=True)
    print(f"Raw records: {raw_count} | After deduplication: {len(df_dedup)} "
          f"(removed {raw_count - len(df_dedup)} duplicate/template rows)")

    X_text = build_text_series(df_dedup)
    y = df_dedup["fraudulent"].astype(int).values

    # Deterministic stratified split (note: original training split is unknown)
    _, X_test, _, y_test = train_test_split(
        X_text, y, test_size=0.20, random_state=42, stratify=y
    )
    print(
        "\n[NOTE] Original train/test split for job_detector.pkl is unknown. "
        "This 20% deduplicated holdout sample may overlap with original training data "
        "and is intended as a reproducible baseline check, not a claim of unseen generalization."
    )

    print("\n=== 3. EVALUATION METRICS (DEDUPLICATED 20% HOLDOUT) ===")
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    print(f"Test Samples:       {len(y_test)} (Fraudulent: {y_test.sum()}, Legit: {(y_test == 0).sum()})")
    print(f"Accuracy:           {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision (Fraud):  {precision_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"Recall (Fraud):     {recall_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"F1-Score (Fraud):   {f1_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"ROC-AUC:            {roc_auc_score(y_test, y_prob):.4f}")
    print(f"PR-AUC (Avg Prec):  {average_precision_score(y_test, y_prob):.4f}")
    print(f"Confusion Matrix:   TN={tn}, FP={fp}, FN={fn}, TP={tp}")

    print("\n=== 4. GLOBAL TF-IDF FEATURE WEIGHTS (TOP 10 PER CLASS) ===")
    print("(Global linear coefficients only; not per-instance causal explanations.)")
    vectorizer = pipeline.steps[0][1]
    classifier = pipeline.steps[-1][1]
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefs = classifier.coef_[0]

    top_fraud_idx = np.argsort(coefs)[-10:][::-1]
    top_legit_idx = np.argsort(coefs)[:10]
    print("Top Fraud-Associated Terms:", [(feature_names[i], round(float(coefs[i]), 3)) for i in top_fraud_idx])
    print("Top Legit-Associated Terms:", [(feature_names[i], round(float(coefs[i]), 3)) for i in top_legit_idx])


if __name__ == "__main__":
    main()