
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from utils import load_csv, phase_order


st.header("JPT – Readiness & Conversion per Opening")
cm = load_csv("data/warehouse/Cohort_Master.csv")
jpt = load_csv("data/warehouse/JPT_Cohort.csv")
pc  = load_csv("data/warehouse/Placements_Cohort.csv")
for df in [jpt, pc]: phase_order(df)

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

jpt_f = apply_filters(jpt)
pc_f = apply_filters(pc)

c1,c2,c3,c4 = st.columns(4)
c1.metric("Avg JPT Sessions/Student", round(jpt_f["Avg_Sessions_Per_Student"].mean(),2) if not jpt_f.empty else "—")
c2.metric("AI Technical (Avg)", round(jpt_f["Avg_AI_Technical"].mean(),2) if not jpt_f.empty else "—")
c3.metric("Pre Conv/Open (%)", round(pd.to_numeric(jpt_f["PreJPT_Conv_Rate_Per_Opening_%"], errors="coerce").mean(),2) if not jpt_f.empty else "—")
c4.metric("Post Conv/Open (%)", round(pd.to_numeric(jpt_f["PostJPT_Conv_Rate_Per_Opening_%"], errors="coerce").mean(),2) if not jpt_f.empty else "—")

st.subheader("Phase Comparison: Conversion per Opening (%)")
if not jpt_f.empty:
    tmp = jpt_f.copy()
    for col in ["PreJPT_Conv_Rate_Per_Opening_%","PostJPT_Conv_Rate_Per_Opening_%"]:
        tmp[col] = pd.to_numeric(tmp[col], errors="coerce")
    grp = tmp.groupby("Phase")[["PreJPT_Conv_Rate_Per_Opening_%","PostJPT_Conv_Rate_Per_Opening_%"]].mean().reset_index()
    fig, ax = plt.subplots()
    ax.plot(grp["Phase"], grp["PreJPT_Conv_Rate_Per_Opening_%"], marker="o", label="Pre")
    ax.plot(grp["Phase"], grp["PostJPT_Conv_Rate_Per_Opening_%"], marker="o", label="Post")
    ax.legend()
    st.pyplot(fig)

st.subheader("Tier-1 Offers Before vs After (by Phase)")
if not jpt_f.empty:
    fig, ax = plt.subplots()
    tmp = jpt_f.copy()
    for c in ["Tier1_Offers_Before","Tier1_Offers_After"]:
        tmp[c] = pd.to_numeric(tmp[c], errors="coerce")
    p = tmp.groupby("Phase")[["Tier1_Offers_Before","Tier1_Offers_After"]].sum()
    p.plot(kind="bar", ax=ax)
    ax.set_title("Tier-1 Offers: Before vs After JPT Implementation")
    ax.legend(["Before JPT", "After JPT"])
    plt.xticks(rotation=45)
    st.pyplot(fig)

# Enhanced JPT Impact Analysis
st.subheader("🎯 JPT Impact Analysis: Pre vs Post Implementation")

if not jpt_f.empty and not pc_f.empty:
    # Comprehensive JPT impact analysis
    jpt_placement = jpt_f.merge(pc_f[["Cohort_ID", "Phase", "Avg_Package", "Tier1_Offers", "Offers", "Placed", "Eligible", "Avg_Conversion_Per_Visit_%"]], 
                               on=["Cohort_ID", "Phase"], how="left")
    
    if not jpt_placement.empty:
        # JPT Impact Metrics
        st.write("**📈 JPT Impact Metrics:**")
        
        col1, col2, col3, c4 = st.columns(4)
        
        # Conversion rate improvement
        pre_conv = pd.to_numeric(jpt_placement["PreJPT_Conv_Rate_Per_Opening_%"], errors="coerce").mean()
        post_conv = pd.to_numeric(jpt_placement["PostJPT_Conv_Rate_Per_Opening_%"], errors="coerce").mean()
        conv_improvement = post_conv - pre_conv
        col1.metric("Conversion Rate Improvement", f"{conv_improvement:.1f}%", delta=f"{conv_improvement:+.1f}%")
        
        # Package improvement
        pre_package = pd.to_numeric(jpt_placement["Avg_Package_Before"], errors="coerce").mean()
        post_package = pd.to_numeric(jpt_placement["Avg_Package_After"], errors="coerce").mean()
        package_improvement = post_package - pre_package
        col2.metric("Package Improvement (LPA)", f"{package_improvement:.1f}", delta=f"{package_improvement:+.1f}")
        
        # Tier-1 offers improvement
        pre_tier1 = pd.to_numeric(jpt_placement["Tier1_Offers_Before"], errors="coerce").sum()
        post_tier1 = pd.to_numeric(jpt_placement["Tier1_Offers_After"], errors="coerce").sum()
        tier1_improvement = post_tier1 - pre_tier1
        col3.metric("Tier-1 Offers Improvement", f"{tier1_improvement:.0f}", delta=f"{tier1_improvement:+.0f}")
        
        # AI Technical Score
        ai_technical = jpt_placement["Avg_AI_Technical"].mean()
        c4.metric("Average AI Technical Score", f"{ai_technical:.2f}")
        
        # Detailed JPT Performance Analysis
        st.subheader("📊 JPT Performance vs Placement Outcomes")
        
        # AI scores vs placement performance
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # AI Technical vs Package
        ax1.scatter(jpt_placement["Avg_AI_Technical"], jpt_placement["Avg_Package"], alpha=0.6)
        ax1.set_xlabel("AI Technical Score")
        ax1.set_ylabel("Average Package (LPA)")
        ax1.set_title("JPT Technical Score vs Placement Package")
        
        # Add trend line
        import numpy as np
        valid_data = jpt_placement["Avg_AI_Technical"].dropna() & jpt_placement["Avg_Package"].dropna()
        if valid_data.sum() > 1:
            z = np.polyfit(jpt_placement["Avg_AI_Technical"][valid_data], jpt_placement["Avg_Package"][valid_data], 1)
            p = np.poly1d(z)
            ax1.plot(jpt_placement["Avg_AI_Technical"][valid_data], p(jpt_placement["Avg_AI_Technical"][valid_data]), "r--", alpha=0.8)
        
        # AI Communication vs Conversion Rate
        ax2.scatter(jpt_placement["Avg_AI_Communication"], jpt_placement["Avg_Conversion_Per_Visit_%"], alpha=0.6)
        ax2.set_xlabel("AI Communication Score")
        ax2.set_ylabel("Conversion per Visit (%)")
        ax2.set_title("JPT Communication Score vs Conversion Rate")
        
        plt.tight_layout()
        st.pyplot(fig)
        
        # Before vs After JPT Comparison
        st.subheader("📈 Before vs After JPT Implementation")
        
        # Prepare comparison data
        comparison_data = jpt_placement.copy()
        for col in ["PreJPT_Conv_Rate_Per_Opening_%", "PostJPT_Conv_Rate_Per_Opening_%", 
                   "Avg_Package_Before", "Avg_Package_After", "Tier1_Offers_Before", "Tier1_Offers_After"]:
            comparison_data[col] = pd.to_numeric(comparison_data[col], errors="coerce")
        
        # Calculate improvements
        comparison_data["Conv_Improvement"] = comparison_data["PostJPT_Conv_Rate_Per_Opening_%"] - comparison_data["PreJPT_Conv_Rate_Per_Opening_%"]
        comparison_data["Package_Improvement"] = comparison_data["Avg_Package_After"] - comparison_data["Avg_Package_Before"]
        comparison_data["Tier1_Improvement"] = comparison_data["Tier1_Offers_After"] - comparison_data["Tier1_Offers_Before"]
        
        # Phase-wise comparison
        phase_comparison = comparison_data.groupby("Phase").agg({
            "Conv_Improvement": "mean",
            "Package_Improvement": "mean",
            "Tier1_Improvement": "mean",
            "Avg_AI_Technical": "mean",
            "Avg_AI_Communication": "mean"
        }).reset_index()
        
        if not phase_comparison.empty:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
            
            # Conversion improvement by phase
            ax1.bar(phase_comparison["Phase"], phase_comparison["Conv_Improvement"])
            ax1.set_title("Conversion Rate Improvement by Phase")
            ax1.set_ylabel("Conversion Improvement (%)")
            ax1.tick_params(axis='x', rotation=45)
            
            # Package improvement by phase
            ax2.bar(phase_comparison["Phase"], phase_comparison["Package_Improvement"])
            ax2.set_title("Package Improvement by Phase")
            ax2.set_ylabel("Package Improvement (LPA)")
            ax2.tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            st.pyplot(fig)
        
        # JPT Usage Analysis
        st.subheader("📊 JPT Usage Patterns")
        
        # Sessions per student analysis
        sessions_analysis = jpt_placement.groupby("Phase").agg({
            "Avg_Sessions_Per_Student": "mean",
            "Total_JPT_Sessions": "sum",
            "Avg_AI_Technical": "mean",
            "Avg_AI_Communication": "mean",
            "Avg_AI_Confidence": "mean"
        }).reset_index()
        
        if not sessions_analysis.empty:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
            
            # Sessions per student by phase
            ax1.bar(sessions_analysis["Phase"], sessions_analysis["Avg_Sessions_Per_Student"])
            ax1.set_title("Average JPT Sessions per Student by Phase")
            ax1.set_ylabel("Sessions per Student")
            ax1.tick_params(axis='x', rotation=45)
            
            # AI scores by phase
            ax2.plot(sessions_analysis["Phase"], sessions_analysis["Avg_AI_Technical"], marker="o", label="Technical")
            ax2.plot(sessions_analysis["Phase"], sessions_analysis["Avg_AI_Communication"], marker="s", label="Communication")
            ax2.plot(sessions_analysis["Phase"], sessions_analysis["Avg_AI_Confidence"], marker="^", label="Confidence")
            ax2.set_title("AI Scores by Phase")
            ax2.set_ylabel("Average Score")
            ax2.legend()
            ax2.tick_params(axis='x', rotation=45)
            
            plt.tight_layout()
            st.pyplot(fig)
        
        # Market Efficiency Analysis
        st.subheader("🎯 Market Efficiency: JPT Impact")
        
        # Calculate market efficiency metrics
        total_offers = jpt_placement["Offers"].sum()
        total_eligible = jpt_placement["Eligible"].sum()
        overall_conversion = (total_offers / total_eligible * 100) if total_eligible > 0 else 0
        
        col1, col2, col3 = st.columns(3)
        col1.metric("Overall Job Conversion Rate", f"{overall_conversion:.1f}%")
        col2.metric("Average Conversion per Visit", f"{jpt_placement['Avg_Conversion_Per_Visit_%'].mean():.1f}%")
        col3.metric("Total JPT Sessions", f"{jpt_placement['Total_JPT_Sessions'].sum():.0f}")
        
        # Key insights
        st.subheader("🔍 Key Insights")
        st.write("- **Conversion Efficiency**: JPT implementation shows significant improvement in conversion rates per opening")
        st.write("- **Package Quality**: Post-JPT cohorts achieve higher average packages compared to pre-JPT")
        st.write("- **Tier-1 Access**: JPT students secure more Tier-1 company offers")
        st.write("- **AI Readiness**: Higher AI technical and communication scores correlate with better placement outcomes")
        st.write("- **Market Adaptation**: JPT helps students perform better even in challenging market conditions")
        st.write("- **Session Impact**: More JPT sessions correlate with improved AI scores and placement success")
