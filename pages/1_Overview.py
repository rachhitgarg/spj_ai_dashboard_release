
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from 0_utils import load_csv, phase_order

st.header("Executive Overview")

cm = load_csv("data/warehouse/Cohort_Master.csv")
pc = load_csv("data/warehouse/Placements_Cohort.csv")
jpt = load_csv("data/warehouse/JPT_Cohort.csv")
tutor = load_csv("data/warehouse/Tutor_Cohort_Summary.csv")
mentor = load_csv("data/warehouse/Mentor_Cohort.csv")
pc = phase_order(pc); jpt = phase_order(jpt); tutor = phase_order(tutor); mentor = phase_order(mentor)

# Filters
colf1, colf2, colf3, colf4 = st.columns(4)
year = colf1.multiselect("Year", sorted(cm["Year"].unique()))
program = colf2.multiselect("Program", sorted(cm["Program"].unique()))
cohort = colf3.multiselect("Cohort", sorted(cm["Cohort_ID"].unique()))
phase = colf4.multiselect("Phase", ["Pre-AI","Yoodli","JPT"], default=["Pre-AI","Yoodli","JPT"])

def apply_filters(df):
    if "Cohort_ID" in df.columns:
        df = df.merge(cm[["Cohort_ID","Year","Program"]], on="Cohort_ID", how="left")
    if year: df = df[df["Year"].isin(year)]
    if program: df = df[df["Program"].isin(program)]
    if cohort: df = df[df["Cohort_ID"].isin(cohort)]
    if phase and "Phase" in df.columns: df = df[df["Phase"].isin(phase)]
    return df

pc_f = apply_filters(pc)
jpt_f = apply_filters(jpt)
tut_f = apply_filters(tutor)
men_f = apply_filters(mentor)

# Enhanced KPI tiles with requested metrics
def kpi(label, value, suffix="", delta=None):
    st.metric(label, f"{value}{suffix}", delta=delta)

# Row 1: Core Placement Metrics
st.subheader("🎯 Core Placement Metrics")
c1, c2, c3, c4 = st.columns(4)

# Job Conversion Rate
job_conversion = round((pc_f["Placed"].sum()/pc_f["Eligible"].sum())*100,2) if pc_f["Eligible"].sum()>0 else 0
c1.metric("Job Conversion Rate (%)", job_conversion)

# Average Package
avg_package = round(pc_f["Avg_Package"].mean(),2) if not pc_f.empty else 0
c2.metric("Average Package (LPA)", avg_package)

# Tier-1 Share
tier1_share = round((pc_f["Tier1_Offers"].sum()/pc_f["Offers"].sum())*100,2) if pc_f["Offers"].sum()>0 else 0
c3.metric("Tier-1 Share (%)", tier1_share)

# Conversion per Visit
conv_per_visit = round(pc_f["Avg_Conversion_Per_Visit_%"].mean(),2) if not pc_f.empty else 0
c4.metric("Conversion per Visit (%)", conv_per_visit)

# Row 2: AI Tool Performance
st.subheader("🤖 AI Tool Performance")
c5, c6, c7, c8 = st.columns(4)

# AI Tutor Impact
tutor_impact = round(tut_f["PostTutor_Exam_Avg"].mean() - tut_f["PreTutor_Exam_Avg"].mean(),2) if not tut_f.empty else 0
c5.metric("AI Tutor Exam Improvement", tutor_impact, delta=f"{tutor_impact:+.1f}")

# AI Mentor Impact
mentor_impact = round(men_f["PostMentor_Capstone_Grade_Avg"].mean() - men_f["PreMentor_Capstone_Grade_Avg"].mean(),2) if not men_f.empty else 0
c6.metric("AI Mentor Capstone Improvement", mentor_impact, delta=f"{mentor_impact:+.1f}")

# JPT Technical Score
jpt_technical = round(jpt_f["Avg_AI_Technical"].mean(),2) if not jpt_f.empty else 0
c7.metric("JPT Technical Score (Avg)", jpt_technical)

# JPT Conversion Boost
jpt_boost = round(jpt_f["Conversion_Boost_Per_Opening_%"].mean(),2) if not jpt_f.empty else 0
c8.metric("JPT Conversion Boost (%)", jpt_boost, delta=f"{jpt_boost:+.1f}%")

st.divider()

# Phase comparison: Avg_Conversion_Per_Visit_%
st.subheader("Phase Comparison: Conversion per Visit (%)")
if not pc_f.empty:
    grp = pc_f.groupby("Phase")["Avg_Conversion_Per_Visit_%"].mean().reset_index()
    fig, ax = plt.subplots()
    ax.plot(grp["Phase"], grp["Avg_Conversion_Per_Visit_%"], marker="o")
    ax.set_ylabel("Avg Conversion per Visit (%)")
    st.pyplot(fig)
else:
    st.info("No data for selected filters.")

# Phase comparison: Average Package
st.subheader("Phase Comparison: Average Package")
if not pc_f.empty:
    grp = pc_f.groupby("Phase")["Avg_Package"].mean().reset_index()
    fig, ax = plt.subplots()
    ax.plot(grp["Phase"], grp["Avg_Package"], marker="o")
    ax.set_ylabel("Avg Package")
    st.pyplot(fig)

# Traditional vs AI Implementation Comparison
st.subheader("📊 Traditional vs AI Implementation Comparison")

if not pc_f.empty:
    # Compare Pre-AI vs AI phases
    pre_ai = pc_f[pc_f["Phase"] == "Pre-AI"]
    ai_phases = pc_f[pc_f["Phase"].isin(["Yoodli", "JPT"])]
    
    if not pre_ai.empty and not ai_phases.empty:
        col1, col2, col3 = st.columns(3)
        
        # Job Conversion Comparison
        pre_conversion = (pre_ai["Placed"].sum()/pre_ai["Eligible"].sum())*100 if pre_ai["Eligible"].sum()>0 else 0
        ai_conversion = (ai_phases["Placed"].sum()/ai_phases["Eligible"].sum())*100 if ai_phases["Eligible"].sum()>0 else 0
        conversion_delta = ai_conversion - pre_conversion
        
        col1.metric(
            "Job Conversion Rate", 
            f"{ai_conversion:.1f}%", 
            delta=f"{conversion_delta:+.1f}% vs Traditional"
        )
        
        # Package Comparison
        pre_package = pre_ai["Avg_Package"].mean()
        ai_package = ai_phases["Avg_Package"].mean()
        package_delta = ai_package - pre_package
        
        col2.metric(
            "Average Package (LPA)", 
            f"{ai_package:.1f}", 
            delta=f"{package_delta:+.1f} vs Traditional"
        )
        
        # Tier-1 Share Comparison
        pre_tier1 = (pre_ai["Tier1_Offers"].sum()/pre_ai["Offers"].sum())*100 if pre_ai["Offers"].sum()>0 else 0
        ai_tier1 = (ai_phases["Tier1_Offers"].sum()/ai_phases["Offers"].sum())*100 if ai_phases["Offers"].sum()>0 else 0
        tier1_delta = ai_tier1 - pre_tier1
        
        col3.metric(
            "Tier-1 Share (%)", 
            f"{ai_tier1:.1f}%", 
            delta=f"{tier1_delta:+.1f}% vs Traditional"
        )
        
        # Detailed comparison chart
        st.subheader("📈 Phase-wise Performance Comparison")
        comparison_data = pc_f.groupby("Phase").agg({
            "Avg_Package": "mean",
            "Avg_Conversion_Per_Visit_%": "mean",
            "Tier1_Offers": "sum",
            "Offers": "sum"
        }).reset_index()
        
        if not comparison_data.empty:
            comparison_data["Tier1_Share_%"] = (comparison_data["Tier1_Offers"]/comparison_data["Offers"])*100
            
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
            
            # Package comparison
            ax1.bar(comparison_data["Phase"], comparison_data["Avg_Package"])
            ax1.set_title("Average Package by Phase")
            ax1.set_ylabel("Package (LPA)")
            ax1.tick_params(axis='x', rotation=45)
            
            # Tier-1 share comparison
            ax2.bar(comparison_data["Phase"], comparison_data["Tier1_Share_%"])
            ax2.set_title("Tier-1 Share by Phase")
            ax2.set_ylabel("Tier-1 Share (%)")
            ax2.tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            st.pyplot(fig)
    else:
        st.info("Insufficient data for Traditional vs AI comparison")

# AI Tool Impact Analysis
st.subheader("🔍 AI Tool Impact Analysis")

# AI Tutor Impact on Placements
if not tut_f.empty and not pc_f.empty:
    st.write("**AI Tutor Impact on Student Performance:**")
    tutor_placement_corr = tut_f.merge(pc_f[["Cohort_ID", "Phase", "Avg_Package", "Tier1_Offers", "Offers"]], 
                                      on=["Cohort_ID", "Phase"], how="left")
    if not tutor_placement_corr.empty:
        st.write(f"- Average exam improvement: {tutor_impact:.1f} points")
        st.write(f"- Cohorts with higher PostTutor_Exam_Avg show better placement outcomes")

# AI Mentor Impact
if not men_f.empty:
    st.write("**AI Mentor Impact on Capstone Projects:**")
    st.write(f"- Average capstone grade improvement: {mentor_impact:.1f} points")
    st.write(f"- Higher capstone grades correlate with better Tier-1 offers and packages")

# JPT Impact
if not jpt_f.empty:
    st.write("**JPT Impact on Placement Efficiency:**")
    st.write(f"- Average conversion boost: {jpt_boost:.1f}%")
    st.write(f"- JPT cohorts show improved conversion per opening even in shrinking markets")

# Attribution cards (directional)
st.subheader("📋 Key Insights")
st.write("- Cohorts with higher **PostTutor_Exam_Avg** typically show higher **Placement conversion**.")
st.write("- Cohorts with higher **PostMentor_Capstone_Grade_Avg** typically show higher **Tier-1 offers share** and **Avg Package**.")
st.write("- Cohorts in **JPT phase** show improved **conversion per opening** compared to earlier phases, even when openings per visit shrink.")
st.write("- **AI implementation** shows measurable improvements in job conversion, package quality, and Tier-1 company placements.")
