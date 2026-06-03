import React from 'react';

export default function TaxGainHarvestingModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Tax Gain Harvesting Explained</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <h3>What is Tax Gain Harvesting?</h3>
            <p>
              Tax Gain Harvesting is a <strong>legal tax optimization strategy</strong> that helps you minimize taxes on investment gains while growing your wealth. It works by strategically realizing capital gains within the annual LTCG (Long-Term Capital Gains) exemption limit and immediately reinvesting the proceeds.
            </p>
          </section>

          <section className="modal-section">
            <h3>How Does It Work?</h3>
            <p>Here's the step-by-step process:</p>
            <ol className="modal-list">
              <li>
                <strong>Calculate Unrealized Gain:</strong> Each year, we calculate the gain in your portfolio (Portfolio Value - Cost Basis).
              </li>
              <li>
                <strong>Harvest Optimal Amount:</strong> We harvest gains up to the available annual LTCG exemption limit (₹1,25,000 per family member) — never more.
              </li>
              <li>
                <strong>No Tax on Harvested Gains:</strong> Gains within the exemption limit are <strong>NOT taxed</strong>.
              </li>
              <li>
                <strong>Increase Cost Basis:</strong> The cost basis is immediately increased by the harvested gain amount, reducing future taxable gains.
              </li>
              <li>
                <strong>Reinvest Automatically:</strong> The harvested amount stays invested in your portfolio for continued growth.
              </li>
            </ol>
          </section>

          <section className="modal-section">
            <h3>Numeric Example</h3>
            <div className="modal-example-box">
              <div className="example-item">
                <label>Portfolio Value (Year 1):</label>
                <span>₹10,00,000</span>
              </div>
              <div className="example-item">
                <label>Cost Basis (Amount Invested):</label>
                <span>₹8,50,000</span>
              </div>
              <div className="example-item">
                <label>Unrealized Gain:</label>
                <span>₹1,50,000</span>
              </div>
              <div className="example-item highlight">
                <label>Annual LTCG Exemption:</label>
                <span>₹1,25,000</span>
              </div>
              <div className="divider"></div>
              <div className="example-item success">
                <label>Harvested Gain:</label>
                <span>₹1,25,000 (min of gain and exemption)</span>
              </div>
              <div className="example-item success">
                <label>Tax Paid on Harvest:</label>
                <span>₹0 (within exemption limit)</span>
              </div>
              <div className="example-item success">
                <label>New Cost Basis:</label>
                <span>₹9,75,000 (₹8,50,000 + ₹1,25,000)</span>
              </div>
              <div className="example-item">
                <label>Remaining Unrealized Gain:</label>
                <span>₹25,000 (₹1,50,000 - ₹1,25,000)</span>
              </div>
            </div>
          </section>

          <section className="modal-section">
            <h3>Key Benefits</h3>
            <ul className="modal-list">
              <li>
                <strong>Tax Savings:</strong> Annually harvest eligible gains tax-free, with the available limit scaling by family members.
              </li>
              <li>
                <strong>Higher Cost Basis:</strong> Increasing cost basis reduces final taxable gains at maturity.
              </li>
              <li>
                <strong>Automatic Process:</strong> The system handles all calculations — no manual intervention needed.
              </li>
              <li>
                <strong>Reinvestment Continues:</strong> Harvested gains remain invested, maintaining growth potential.
              </li>
              <li>
                <strong>Legal & Compliant:</strong> This is a recognized tax optimization technique within Indian income tax laws.
              </li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Important Notes</h3>
            <ul className="modal-list">
              <li>
                <strong>Exemption Limit:</strong> Currently set to ₹1,25,000 per family member per year (as per current Indian LTCG tax rules). This may change with tax law amendments.
              </li>
              <li>
                <strong>Annual Frequency:</strong> Harvesting happens automatically once per year. You cannot modify frequency or harvest amount.
              </li>
              <li>
                <strong>Never Over-Harvest:</strong> The system will never harvest gains exceeding the exemption limit, ensuring zero tax on harvested gains.
              </li>
              <li>
                <strong>Estimates Only:</strong> These calculations are projections based on assumed returns. Actual tax laws may change, and real-world results will vary.
              </li>
              <li>
                <strong>Beginner-Friendly:</strong> Just enable the toggle to activate this optimization. Everything else is automatic!
              </li>
            </ul>
          </section>

          <section className="modal-section">
            <h3>Mode A: Optimal Harvesting</h3>
            <p>
              This calculator uses <strong>Mode A: Optimal Harvesting</strong>, which automatically harvests the maximum allowed gains each year based on the family-member count. This is the most tax-efficient approach for most investors.
            </p>
            <p>
              You can modify the family-member count. The calculator keeps these settings automatic:
            </p>
            <ul className="modal-list">
              <li>Harvest amount (fixed at min(unrealized gain, available family exemption))</li>
              <li>Harvest frequency (fixed at annual)</li>
              <li>Base LTCG exemption per member (currently ₹1,25,000)</li>
            </ul>
            <p>
              This ensures optimal, automatic tax management without any guesswork.
            </p>
          </section>

          <section className="modal-section">
            <h3>Comparison Example (10-Year Investment)</h3>
            <div className="comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Without Harvesting</th>
                    <th>With Harvesting</th>
                    <th>Tax Saved</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Investment</strong></td>
                    <td>₹60,00,000</td>
                    <td>₹60,00,000</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td><strong>Final Corpus</strong></td>
                    <td>₹1,80,00,000</td>
                    <td>₹1,80,00,000</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td><strong>Gain</strong></td>
                    <td>₹1,20,00,000</td>
                    <td>₹1,20,00,000</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td><strong>Total Harvested</strong></td>
                    <td>₹0</td>
                    <td>₹1,20,00,000*</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td><strong>Taxable Gain</strong></td>
                    <td>₹1,19,75,000</td>
                    <td>₹0 (all harvested)</td>
                    <td>—</td>
                  </tr>
                  <tr className="highlight-row">
                    <td><strong>Tax @ 12.5%</strong></td>
                    <td><strong>₹14,96,875</strong></td>
                    <td><strong>₹0</strong></td>
                    <td><strong>₹14,96,875</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Post-Tax Value</strong></td>
                    <td>₹1,65,03,125</td>
                    <td>₹1,80,00,000</td>
                    <td>₹14,96,875 (9%)</td>
                  </tr>
                </tbody>
              </table>
              <p className="table-note">*Assumes harvesting up to the available annual family exemption over 10 years</p>
            </div>
          </section>

          <section className="modal-section">
            <h3>Disclaimer</h3>
            <p>
              This calculator provides <strong>estimates only</strong> based on assumed investment returns and current tax laws. Tax laws in India may change at any time. This tool is for educational and planning purposes — please consult a qualified tax professional or financial advisor for personalized advice before making investment decisions.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-primary" onClick={onClose}>Got It!</button>
        </div>
      </div>
    </div>
  );
}
