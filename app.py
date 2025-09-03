
import streamlit as st
from 0_utils import load_table

st.set_page_config(page_title="SPJ AI Cohort Outcomes Dashboard", layout="wide")
st.title("📊 SPJ AI Cohort Outcomes Dashboard")

# Global filters in sidebar
st.sidebar.header("🎛️ Global Filters")

# Load cohort master for global filters
try:
    cm = load_table("data/warehouse/Cohort_Master.csv")
    
    # Tool filter
    tools = st.sidebar.multiselect(
        "🔧 AI Tools", 
        ["AI Tutor", "AI Mentor", "JPT"], 
        default=["AI Tutor", "AI Mentor", "JPT"]
    )
    
    # Course filter (GMBA/MGB)
    courses = st.sidebar.multiselect(
        "🎓 Courses", 
        ["GMBA", "MGB"], 
        default=["GMBA", "MGB"]
    )
    
    # Cohort filter
    cohorts = st.sidebar.multiselect(
        "👥 Cohorts", 
        sorted(cm["Cohort_ID"].unique()) if not cm.empty else [],
        default=[]
    )
    
    # Store in session state for use across pages
    st.session_state.global_tools = tools
    st.session_state.global_courses = courses
    st.session_state.global_cohorts = cohorts
    
except Exception as e:
    st.sidebar.error(f"Could not load cohort data: {e}")
    st.session_state.global_tools = ["AI Tutor", "AI Mentor", "JPT"]
    st.session_state.global_courses = ["GMBA", "MGB"]
    st.session_state.global_cohorts = []

st.write("Use the sidebar to navigate: Overview, AI Tutor, AI Mentor, JPT, Placements & Company Visits, Uploads, Definitions.")
