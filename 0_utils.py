import pandas as pd
from functools import lru_cache
from typing import Dict, List, Optional


@lru_cache(maxsize=64)
def load_table(path: str) -> pd.DataFrame:
	"""Load a table from CSV or Excel based on file extension."""
	if path.lower().endswith(".csv"):
		return pd.read_csv(path)
	if path.lower().endswith(".xlsx") or path.lower().endswith(".xls"):
		return pd.read_excel(path)
	# Default to CSV if no extension given
	return pd.read_csv(path)


# Backward-compatible alias used by existing pages
def load_csv(path: str) -> pd.DataFrame:
	return load_table(path)


def phase_order(df: pd.DataFrame, col: str = "Phase") -> pd.DataFrame:
	cat = pd.CategoricalDtype(categories=["Pre-AI","Yoodli","JPT"], ordered=True)
	if col in df.columns:
		df[col] = df[col].astype(cat)
	return df


def coerce_numeric_columns(df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
	for c in columns:
		if c in df.columns:
			df[c] = pd.to_numeric(df[c], errors="coerce")
	return df


def enforce_dtypes(df: pd.DataFrame, dtype_map: Dict[str, str]) -> pd.DataFrame:
	"""Enforce industry-standard dtypes where possible.

	Supported dtypes: 'int', 'float', 'string', 'category', 'datetime'
	"""
	for col, dt in dtype_map.items():
		if col not in df.columns:
			continue
		if dt == "int":
			df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
		elif dt == "float":
			df[col] = pd.to_numeric(df[col], errors="coerce")
		elif dt == "string":
			df[col] = df[col].astype("string").str.strip()
		elif dt == "category":
			df[col] = df[col].astype("category")
		elif dt == "datetime":
			df[col] = pd.to_datetime(df[col], errors="coerce")
	return df


SCHEMAS_DTYPES: Dict[str, Dict[str, str]] = {
	"Cohort_Master": {
		"Cohort_ID": "string", "Year": "int", "Program": "category", "Batch_Size": "int", "Phase": "category",
	},
	"Company_Visits": {
		"Cohort_ID": "string", "Phase": "category", "Company_Name": "string", "Visit_Date": "datetime",
		"Role_Title": "string", "Role_Family": "category", "Tier": "category", "Sector": "category",
		"Geography": "category", "Is_Repeat_Recruiter": "category", "Openings_Announced": "int",
		"Applicants_Attended": "int", "Interview_Slots": "int", "Shortlisted": "int", "Offers_Issued": "int",
		"Joined_Count": "int",
	},
	"Placements_Cohort": {
		"Cohort_ID": "string", "Phase": "category", "Eligible": "int", "Applied": "int", "Shortlisted": "int",
		"Offers": "int", "Placed": "int", "Avg_Package": "float", "Median_Package": "float",
		"Highest_Package": "float", "Tier1_Offers": "int", "Tier2_Offers": "int", "Startup_Offers": "int",
		"PSU_Offers": "int", "Tech_Role_Share_%": "float", "Finance_Role_Share_%": "float",
		"Consulting_Role_Share_%": "float", "Other_Role_Share_%": "float",
		"Avg_Conversion_Per_Visit_%": "float", "Avg_Openings_Per_Visit": "float",
	},
	"JPT_Cohort": {
		"Cohort_ID": "string", "Phase": "category", "Total_JPT_Sessions": "int",
		"Avg_Sessions_Per_Student": "float", "Avg_AI_Confidence": "float", "Avg_AI_Communication": "float",
		"Avg_AI_Technical": "float", "PreJPT_Conv_Rate_Per_Opening_%": "float",
		"PostJPT_Conv_Rate_Per_Opening_%": "float", "Conversion_Boost_Per_Opening_%": "float",
		"Tier1_Offers_Before": "int", "Tier1_Offers_After": "int",
		"Avg_Package_Before": "float", "Avg_Package_After": "float",
	},
	"Tutor_Sessions": {
		"Cohort_ID": "string", "Phase": "category", "Unit_Code": "string", "Unit_Name": "string",
		"Session_ID": "string", "Session_Type": "category", "Created_Week": "string", "Assigned_Count": "int",
	},
	"Tutor_Session_Utilization": {
		"Cohort_ID": "string", "Phase": "category", "Session_ID": "string", "Week": "string",
		"Started_Count": "int", "Completed_Count": "int", "Avg_TRS": "float", "Highest_TRS": "float",
	},
	"Tutor_Weekly_Summary": {
		"Cohort_ID": "string", "Phase": "category", "Week": "string",
		"Sessions_Created_This_Week": "int", "Overall_Utilization_This_Week_%": "float",
		"Units_With_Sessions_Count": "int", "Units_Adopted_%": "float", "Active_Users_%": "float",
		"Avg_Sessions_Per_Student": "float",
	},
	"Tutor_Cohort_Summary": {
		"Cohort_ID": "string", "Phase": "category", "Active_Users_%": "float",
		"Units_With_Sessions_Count": "int", "Units_Adopted_%": "float", "Avg_Sessions_Per_Student": "float",
		"PreTutor_Exam_Avg": "float", "PostTutor_Exam_Avg": "float",
		"PreTutor_Assignment_Avg": "float", "PostTutor_Assignment_Avg": "float", "Pass_Percentage": "float",
	},
	"Mentor_Cohort": {
		"Cohort_ID": "string", "Phase": "category",
		"PreMentor_Capstone_Grade_Avg": "float", "PostMentor_Capstone_Grade_Avg": "float",
		"Grade_A_Distribution_%_Pre": "float", "Grade_A_Distribution_%_Post": "float",
		"Higher_Degree_Attempts": "int", "Higher_Degree_Admissions": "int",
		"PostMentor_Exam_Avg": "float", "Tier1_Offers_Share_%": "float", "Avg_Package_in_Phase": "float",
	},
}


def apply_schema_dtypes(df: pd.DataFrame, dataset_name: str) -> pd.DataFrame:
	if dataset_name in SCHEMAS_DTYPES:
		return enforce_dtypes(df, SCHEMAS_DTYPES[dataset_name])
	return df


