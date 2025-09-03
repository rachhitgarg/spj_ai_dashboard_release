# utils.py
import pandas as pd
from functools import lru_cache

# ---------- fast CSV loader ----------
@lru_cache(maxsize=32)
def load_csv(path: str) -> pd.DataFrame:
    return pd.read_csv(path)

def load_table(name: str) -> pd.DataFrame:
    """Shorthand to load from data/warehouse/<name>.csv"""
    return load_csv(f"data/warehouse/{name}.csv")

# ---------- common ordering for the 'Phase' column ----------
def phase_order(df: pd.DataFrame, col: str = "Phase") -> pd.DataFrame:
    cat = pd.CategoricalDtype(categories=["Pre-AI", "Yoodli", "JPT"], ordered=True)
    if col in df.columns:
        df[col] = df[col].astype(cat)
    return df

# ---------- schemas for Data Uploader ----------
# Minimal columns used by the pages so uploads validate & cast types.
SCHEMAS_DTYPES = {
    "Cohort_Master": {
        "Cohort_ID": "string",
        "Year": "Int64",
        "Program": "string",
    },
    "Placements_Cohort": {
        "Cohort_ID": "string",
        "Phase": "string",
        "Eligible": "Int64",
        "Applied": "Int64",
        "Shortlisted": "Int64",
        "Offers": "Int64",
        "Placed": "Int64",
        "Avg_Package": "Float64",
        "Tier1_Offers": "Int64",
        "Avg_Conversion_Per_Visit_%": "Float64",
    },
    "Company_Visits": {
        "Cohort_ID": "string",
        "Phase": "string",
        "Role_Family": "string",
        "Offers_Issued": "Int64",
        "Openings_Announced": "Int64",
    },
    "Mentor_Cohort": {
        "Cohort_ID": "string",
        "Phase": "string",
        "PreMentor_Capstone_Grade_Avg": "Float64",
        "PostMentor_Capstone_Grade_Avg": "Float64",
        "Grade_A_Distribution_%_Pre": "Float64",
        "Grade_A_Distribution_%_Post": "Float64",
    },
    "JPT_Cohort": {
        "Cohort_ID": "string",
        "Phase": "string",
        "Avg_Sessions_Per_Student": "Float64",
        "Avg_AI_Technical": "Float64",
        "Avg_AI_Communication": "Float64",
        "Avg_AI_Confidence": "Float64",
        "PreJPT_Conv_Rate_Per_Opening_%": "Float64",
        "PostJPT_Conv_Rate_Per_Opening_%": "Float64",
        "Tier1_Offers_Before": "Int64",
        "Tier1_Offers_After": "Int64",
        "Avg_Package_Before": "Float64",
        "Avg_Package_After": "Float64",
    },
    "Tutor_Sessions": {
        "Cohort_ID": "string",
        "Unit_Code": "string",
        "Session_ID": "string",
        "Assigned_Count": "Int64",
    },
    "Tutor_Session_Utilization": {
        "Session_ID": "string",
        "Avg_TRS": "Float64",
        "Highest_TRS": "Float64",
    },
    "Tutor_Weekly_Summary": {
        "Week": "string",
        "Sessions_Created_This_Week": "Int64",
        "Overall_Utilization_This_Week_%": "Float64",
        "Units_Adopted_%": "Float64",
        "Active_Users_%": "Float64",
    },
    "Tutor_Cohort_Summary": {
        "Cohort_ID": "string",
        "Phase": "string",
        "PreTutor_Exam_Avg": "Float64",
        "PostTutor_Exam_Avg": "Float64",
        "Higher_Degree_Attempts": "Int64",
        "Higher_Degree_Admissions": "Int64",
    },
}

def apply_schema_dtypes(df: pd.DataFrame, dataset: str) -> pd.DataFrame:
    """Cast columns to the dtypes defined in SCHEMAS_DTYPES[dataset]."""
    spec = SCHEMAS_DTYPES.get(dataset, {})
    for col, dtype in spec.items():
        if col not in df.columns:
            # allow missing optional columns; uploader page already warns on missing
            continue
        if dtype in ("Int64", "Float64"):
            df[col] = pd.to_numeric(df[col], errors="coerce").astype(dtype)
        elif dtype == "string":
            df[col] = df[col].astype("string")
        elif dtype == "datetime":
            df[col] = pd.to_datetime(df[col], errors="coerce")
        else:
            # fallback: try pandas dtype directly
            df[col] = df[col].astype(dtype, errors="ignore")
    return df
