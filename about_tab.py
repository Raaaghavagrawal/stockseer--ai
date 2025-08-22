import streamlit as st
import pandas as pd
import numpy as np

# --- TAB : About ---
def render_about_tab(tab, ticker, s_info_full, about_info, sector, industry, mcap_val, exch_val, current_currency_symbol, company_officers, analyst_recs, analyst_price_target_data, history_and_strategies=None):
    with tab:
        # --- Title ---
        st.markdown(f"""
            <div class="animated-card">
                <h3 class="glow-text">📊 About {s_info_full.get('shortName', ticker)}</h3>
            </div>
        """, unsafe_allow_html=True)
        
        # --- Key Info Cards ---
        st.markdown("#### Key Information")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric(" BSE ", f"{s_info_full.get('regularMarketPrice', 'N/A')}")
        with col2:
            st.metric("Sector", sector)
        with col3:
            st.metric("Industry", industry)
        with col4:
            st.metric("Market Cap", fmt_f_fundamentals(mcap_val, "b", current_currency_symbol))
            
        # --- Business Description ---
        st.markdown("#### 📝 Business Description")
        st.markdown(f"""
            <div style="padding: 15px; border-radius: 10px; background: rgba(26,26,26,0.9); border-left: 5px solid #39ff14; margin: 10px 0;">
                {about_info if about_info and "failed" not in about_info.lower() else "No detailed business description available."}
            </div>
        """, unsafe_allow_html=True)

        # --- History & Key Strategies ---
        st.markdown("#### 📜 History & Key Business Strategies")
        st.markdown(f"""
            <div style="padding: 15px; border-radius: 10px; background: rgba(26,26,26,0.9); margin: 10px 0; border: 2px solid #39ff14;">
                {history_and_strategies if history_and_strategies else "<p>Company profile information not available.</p>"}
            </div>
        """, unsafe_allow_html=True)

        # --- Financial & Market Data Tabs ---
        st.markdown("---")
        data_tabs = st.tabs(["📊 Key Statistics", "👥 Company Officers", "📈 Analyst Coverage"])
        
        # --- Key Statistics Tab ---
        with data_tabs[0]:
            stats_col1, stats_col2, stats_col3 = st.columns(3)
            with stats_col1:
                st.markdown("##### Market Data")
                st.metric("52 Week High", fmt_f_fundamentals(s_info_full.get('fiftyTwoWeekHigh'), "$", current_currency_symbol))
                st.metric("52 Week Low", fmt_f_fundamentals(s_info_full.get('fiftyTwoWeekLow'), "$", current_currency_symbol))
                st.metric("Avg. Volume (3M)", fmt_f_fundamentals(s_info_full.get('averageVolume'), "i"))

            with stats_col2:
                st.markdown("##### Financial Ratios")
                st.metric("P/E Ratio (TTM)", fmt_f_fundamentals(s_info_full.get('trailingPE'), "r"))
                st.metric("Forward P/E", fmt_f_fundamentals(s_info_full.get('forwardPE'), "r"))
                st.metric("Beta (5Y Monthly)", fmt_f_fundamentals(s_info_full.get('beta'), "r"))

            with stats_col3:
                st.markdown("##### Dividend Info")
                st.metric("Dividend Rate", fmt_f_fundamentals(s_info_full.get('dividendRate'), "$", current_currency_symbol))
                st.metric("Dividend Yield", fmt_f_fundamentals(s_info_full.get('dividendYield'), "%"))
                st.metric("Payout Ratio", fmt_f_fundamentals(s_info_full.get('payoutRatio'), "%"))

        # --- Company Officers Tab ---
        with data_tabs[1]:
            if company_officers:
                for officer in company_officers:
                    st.markdown(f"""
                        <div style="padding: 15px; border-radius: 10px; background: rgba(26,26,26,0.9); margin: 10px 0; border: 2px solid #39ff14;">
                            <h5 style="color: #39ff14;">{officer.get('name', 'N/A')}</h5>
                            <p style="margin: 0;"><b>Title:</b> {officer.get('title', 'N/A')}</p>
                            {f"<p style='margin: 0;'><b>Total Pay:</b> {current_currency_symbol}{officer.get('totalPay', 0):,.0f}</p>" if officer.get('totalPay') else ''}
                        </div>
                    """, unsafe_allow_html=True)
            else:
                st.info("No company officer data available.")

        # --- Analyst Coverage Tab ---
        with data_tabs[2]:
            if analyst_recs is not None and not analyst_recs.empty:
                st.markdown("##### Recent Recommendations")
                try:
                    recent_recs = analyst_recs.tail(5)
                    firm_col = next((col for col in ['Firm', 'firm', 'Broker', 'broker'] if col in analyst_recs.columns), None)
                    grade_col = next((col for col in ['To Grade', 'to_grade', 'Rating', 'rating', 'Recommendation', 'recommendation'] if col in analyst_recs.columns), None)
                    
                    if firm_col and grade_col:
                        for idx, rec in recent_recs.iterrows():
                            date_str = idx.strftime('%Y-%m-%d') if isinstance(idx, pd.Timestamp) else str(idx)
                            st.markdown(f"""
                                <div style="padding: 10px; border-radius: 5px; background: rgba(26,26,26,0.9); margin: 5px 0; border: 2px solid #39ff14;">
                                    <span style="color: #39ff14;">{rec[firm_col]}</span>: {rec[grade_col]} ({date_str})
                                </div>
                            """, unsafe_allow_html=True)
                    else:
                        st.info("Analyst recommendations format not recognized.")
                except Exception as e:
                    st.warning(f"Error displaying analyst recommendations: {str(e)}")

                if analyst_price_target_data is not None:
                    st.markdown("##### Price Targets")
                    pt_cols = st.columns(4)
                    with pt_cols[0]:
                        st.metric("Low", fmt_f_fundamentals(analyst_price_target_data.get('low'), "$", current_currency_symbol))
                    with pt_cols[1]:
                        st.metric("Mean", fmt_f_fundamentals(analyst_price_target_data.get('mean'), "$", current_currency_symbol))
                    with pt_cols[2]:
                        st.metric("High", fmt_f_fundamentals(analyst_price_target_data.get('high'), "$", current_currency_symbol))
                    with pt_cols[3]:
                        st.metric("Current", fmt_f_fundamentals(s_info_full.get('regularMarketPrice'), "$", current_currency_symbol))
            else:
                st.info("No analyst coverage data available for this stock.")

def fmt_f_fundamentals(v, t, cur_sym="$"): 
    if v is None or pd.isna(v) or not isinstance(v,(int,float,np.number)): return "N/A"
    if t == "b": return f"{cur_sym}{v/1e9:.2f}B"
    elif t == "m": return f"{cur_sym}{v/1e6:.2f}M"
    elif t == "%": return f"{v*100:.2f}%"
    elif t == "r": return f"{v:.2f}"
    elif t == "$": return f"{cur_sym}{v:.2f}" 
    elif t == "i": return f"{v:,.0f}"
    return str(v) 