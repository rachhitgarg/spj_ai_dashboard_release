
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from 0_utils import load_csv, phase_order

st.header("AI Tutor – Usage & Impact (Unit-based)")
cm = load_csv("data/warehouse/Cohort_Master.csv")
sess = load_csv("data/warehouse/Tutor_Sessions.csv")
util = load_csv("data/warehouse/Tutor_Session_Utilization.csv")
wk = load_csv("data/warehouse/Tutor_Weekly_Summary.csv")
sumc = load_csv("data/warehouse/Tutor_Cohort_Summary.csv")
for df in [sess, util, wk, sumc]: phase_order(df)

# Filters
col1, col2, col3, col4 = st.columns(4)
year = col1.multiselect("Year", sorted(cm["Year"].unique()))
program = col2.multiselect("Program", sorted(cm["Program"].unique()))
cohort = col3.multiselect("Cohort", sorted(cm["Cohort_ID"].unique()))
phase = col4.multiselect("Phase", ["Pre-AI","Yoodli","JPT"], default=["Pre-AI","Yoodli","JPT"])

def apply_filters(df):
    if "Cohort_ID" in df.columns:
        df = df.merge(cm[["Cohort_ID","Year","Program"]], on="Cohort_ID", how="left")
    if year: df = df[df["Year"].isin(year)]
    if program: df = df[df["Program"].isin(program)]
    if cohort: df = df[df["Cohort_ID"].isin(cohort)]
    if phase and "Phase" in df.columns: df = df[df["Phase"].isin(phase)]
    return df

sess_f = apply_filters(sess)
util_f = apply_filters(util)
wk_f = apply_filters(wk)
sumc_f = apply_filters(sumc)

# KPIs
c1,c2,c3,c4 = st.columns(4)
c1.metric("Units with Sessions", int(sess_f["Unit_Code"].nunique()) if not sess_f.empty else 0)
c2.metric("Sessions Created", len(sess_f) if not sess_f.empty else 0)
c3.metric("Avg TRS (weekly)", round(util_f["Avg_TRS"].mean(),2) if not util_f.empty else 0)
c4.metric("Highest TRS (weekly)", round(util_f["Highest_TRS"].max(),2) if not util_f.empty else 0)

st.subheader("Sessions Created per Week")
if not wk_f.empty:
    grp = wk_f.groupby("Week")["Sessions_Created_This_Week"].sum().reset_index()
    fig, ax = plt.subplots()
    ax.plot(grp["Week"], grp["Sessions_Created_This_Week"], marker="o")
    ax.set_ylabel("Sessions Created")
    plt.xticks(rotation=45, ha="right")
    st.pyplot(fig)

st.subheader("Overall Utilization per Week (%)")
if not wk_f.empty:
    grp = wk_f.groupby("Week")["Overall_Utilization_This_Week_%"].mean().reset_index()
    fig, ax = plt.subplots()
    ax.plot(grp["Week"], grp["Overall_Utilization_This_Week_%"], marker="o")
    ax.set_ylabel("Utilization (%)")
    plt.xticks(rotation=45, ha="right")
    st.pyplot(fig)

st.subheader("Academic Averages (Pre vs Post Tutor)")
if not sumc_f.empty:
    fig, ax = plt.subplots()
    p = sumc_f.groupby("Phase")[["PreTutor_Exam_Avg","PostTutor_Exam_Avg"]].mean()
    p.plot(kind="bar", ax=ax)
    ax.set_ylabel("Exam Average")
    ax.set_title("Exam Performance: Pre vs Post AI Tutor")
    ax.legend(["Pre-Tutor", "Post-Tutor"])
    plt.xticks(rotation=45)
    st.pyplot(fig)

# Enhanced AI Tutor Impact Analysis
st.subheader("🎯 AI Tutor Impact on Student Outcomes")

# Load placement data for correlation analysis
try:
    pc = load_csv("data/warehouse/Placements_Cohort.csv")
    pc = phase_order(pc)
    pc_f = apply_filters(pc)
    
    if not sumc_f.empty and not pc_f.empty:
        # Merge tutor and placement data
        tutor_placement = sumc_f.merge(pc_f[["Cohort_ID", "Phase", "Avg_Package", "Tier1_Offers", "Offers", "Placed", "Eligible"]], 
                                      on=["Cohort_ID", "Phase"], how="left")
        
        if not tutor_placement.empty:
            # Impact on Placement Performance
            st.write("**📈 Impact on Placement Performance:**")
            
            col1, col2, col3 = st.columns(3)
            
            # Exam improvement vs Package correlation
            exam_improvement = tutor_placement["PostTutor_Exam_Avg"] - tutor_placement["PreTutor_Exam_Avg"]
            package_corr = exam_improvement.corr(tutor_placement["Avg_Package"])
            
            col1.metric("Exam Improvement vs Package Correlation", f"{package_corr:.3f}")
            
            # Higher exam scores vs Tier-1 offers
            high_exam = tutor_placement[tutor_placement["PostTutor_Exam_Avg"] > tutor_placement["PostTutor_Exam_Avg"].median()]
            low_exam = tutor_placement[tutor_placement["PostTutor_Exam_Avg"] <= tutor_placement["PostTutor_Exam_Avg"].median()]
            
            high_tier1_rate = (high_exam["Tier1_Offers"].sum() / high_exam["Offers"].sum() * 100) if high_exam["Offers"].sum() > 0 else 0
            low_tier1_rate = (low_exam["Tier1_Offers"].sum() / low_exam["Offers"].sum() * 100) if low_exam["Offers"].sum() > 0 else 0
            
            col2.metric("Tier-1 Rate (High Exam Scores)", f"{high_tier1_rate:.1f}%")
            col3.metric("Tier-1 Rate (Low Exam Scores)", f"{low_tier1_rate:.1f}%")
            
            # Scatter plot: Exam improvement vs Package
            st.subheader("📊 Exam Improvement vs Placement Package")
            fig, ax = plt.subplots()
            ax.scatter(exam_improvement, tutor_placement["Avg_Package"], alpha=0.6)
            ax.set_xlabel("Exam Improvement (Post - Pre)")
            ax.set_ylabel("Average Package (LPA)")
            ax.set_title("AI Tutor Exam Improvement vs Placement Package")
            
            # Add trend line
            import numpy as np
            z = np.polyfit(exam_improvement.dropna(), tutor_placement["Avg_Package"].dropna(), 1)
            p = np.poly1d(z)
            ax.plot(exam_improvement.dropna(), p(exam_improvement.dropna()), "r--", alpha=0.8)
            
            st.pyplot(fig)
            
            # Unit-wise Performance Analysis
            st.subheader("📚 Unit-wise Performance Analysis")
            if not sess_f.empty:
                unit_performance = sess_f.groupby("Unit_Code").agg({
                    "Assigned_Count": "sum",
                    "Session_ID": "count"
                }).reset_index()
                unit_performance.columns = ["Unit_Code", "Total_Assignments", "Sessions_Created"]
                
                # Merge with utilization data
                if not util_f.empty:
                    unit_util = util_f.groupby("Session_ID")["Avg_TRS"].mean().reset_index()
                    unit_util = unit_util.merge(sess_f[["Session_ID", "Unit_Code"]], on="Session_ID")
                    unit_avg_trs = unit_util.groupby("Unit_Code")["Avg_TRS"].mean().reset_index()
                    unit_performance = unit_performance.merge(unit_avg_trs, on="Unit_Code", how="left")
                
                st.dataframe(unit_performance.sort_values("Total_Assignments", ascending=False))
                
                # Top performing units
                if "Avg_TRS" in unit_performance.columns:
                    top_units = unit_performance.nlargest(5, "Avg_TRS")
                    st.write("**🏆 Top 5 Units by Average TRS:**")
                    for _, unit in top_units.iterrows():
                        st.write(f"- {unit['Unit_Code']}: {unit['Avg_TRS']:.2f} TRS")
        
        # Higher Degree Performance
        st.subheader("🎓 Higher Degree Performance")
        if "Higher_Degree_Attempts" in sumc_f.columns and "Higher_Degree_Admissions" in sumc_f.columns:
            high_degree_success = (sumc_f["Higher_Degree_Admissions"].sum() / sumc_f["Higher_Degree_Attempts"].sum() * 100) if sumc_f["Higher_Degree_Attempts"].sum() > 0 else 0
            st.metric("Higher Degree Success Rate", f"{high_degree_success:.1f}%")
            
            # Correlation with exam performance
            if not sumc_f.empty:
                exam_high_degree_corr = sumc_f["PostTutor_Exam_Avg"].corr(sumc_f["Higher_Degree_Admissions"])
                st.write(f"**Correlation between Post-Tutor Exam Performance and Higher Degree Admissions:** {exam_high_degree_corr:.3f}")

except Exception as e:
    st.warning(f"Could not load placement data for correlation analysis: {e}")

# Usage Patterns and Trends
st.subheader("📈 Usage Patterns and Trends")
if not wk_f.empty:
    # Weekly adoption trends
    adoption_trend = wk_f.groupby("Week")["Units_Adopted_%"].mean().reset_index()
    if not adoption_trend.empty:
        fig, ax = plt.subplots()
        ax.plot(adoption_trend["Week"], adoption_trend["Units_Adopted_%"], marker="o")
        ax.set_title("Unit Adoption Rate Over Time")
        ax.set_ylabel("Units Adopted (%)")
        ax.set_xlabel("Week")
        plt.xticks(rotation=45)
        st.pyplot(fig)
    
    # Active users trend
    users_trend = wk_f.groupby("Week")["Active_Users_%"].mean().reset_index()
    if not users_trend.empty:
        fig, ax = plt.subplots()
        ax.plot(users_trend["Week"], users_trend["Active_Users_%"], marker="o", color="green")
        ax.set_title("Active Users Percentage Over Time")
        ax.set_ylabel("Active Users (%)")
        ax.set_xlabel("Week")
        plt.xticks(rotation=45)
        st.pyplot(fig)
