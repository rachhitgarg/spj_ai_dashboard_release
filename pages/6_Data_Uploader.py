
import streamlit as st
import pandas as pd
import io, os, json
from utils import load_csv, phase_order


st.header("Data Uploader (CSV/Excel with Schema & Dtype Validation)")

schemas = {k: list(v.keys()) for k, v in SCHEMAS_DTYPES.items()}

# Show available templates
st.subheader("📋 Available Templates")
import os
template_dir = "data/templates"
if os.path.exists(template_dir):
    templates = [f for f in os.listdir(template_dir) if f.endswith(('.xlsx', '.xls'))]
    if templates:
        for template in templates:
            st.write(f"📄 {template}")
            with open(os.path.join(template_dir, template), "rb") as f:
                st.download_button(
                    label=f"Download {template}",
                    data=f.read(),
                    file_name=template,
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
    else:
        st.info("No templates found in data/templates/")
else:
    st.info("Template directory not found")

st.divider()

dataset = st.selectbox("Choose dataset to upload", list(schemas.keys()))
file = st.file_uploader("Upload file (CSV or Excel) matching the selected schema", type=["csv","xlsx","xls"])

if file:
    try:
        name = file.name.lower()
        if name.endswith(".csv"):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        expected = schemas[dataset]
        missing = [c for c in expected if c not in df.columns]
        extra = [c for c in df.columns if c not in expected]
        if missing:
            st.error(f"Missing columns: {missing}")
        else:
            if extra:
                st.warning(f"Extra columns will be ignored: {extra}")
                df = df[expected]
            # Enforce dtypes
            df = apply_schema_dtypes(df, dataset)
            os.makedirs("data/warehouse", exist_ok=True)
            out_path = f"data/warehouse/{dataset}.csv"
            df.to_csv(out_path, index=False)
            st.success(f"Uploaded and validated successfully. Saved to {out_path}")
            st.write("Preview:")
            st.dataframe(df.head())
    except Exception as e:
        st.error(f"Upload failed: {e}")
