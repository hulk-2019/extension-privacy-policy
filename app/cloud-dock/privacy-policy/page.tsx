import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CloudDock Privacy Policy",
  description: "Privacy Policy for the CloudDock browser extension",
};

export default function PrivacyPolicyEnPage() {
  return (
    <>
      <div className="privacy-container">
        <h1>CloudDock Privacy Policy</h1>
        <p className="meta">Effective Date: August 11, 2026</p>

        <div className="highlight">
          This Privacy Policy explains how the CloudDock browser extension (the
          &ldquo;Extension&rdquo;) collects, uses, stores, and protects your information.
          Please read this policy carefully before using the Extension.
        </div>

        <h2>1. Overview</h2>
        <p>
          CloudDock is a browser-based cloud storage management tool that lets you browse,
          upload, preview, organize, and share files in your object-storage buckets (such as
          Aliyun OSS, Tencent Cloud COS, and AWS S3) while viewing any webpage.
          The Extension follows a &ldquo;local-first, minimal collection&rdquo; principle: your data is
          stored locally in your browser by default, and the Extension developer does not
          collect, upload, or sell any of your personal data.
        </p>

        <h2>2. Information We Collect</h2>
        <p>
          The Extension collects the following information, solely to provide its core
          functionality:
        </p>
        <table>
          <thead>
            <tr>
              <th>Data Type</th>
              <th>Description</th>
              <th>Storage Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cloud storage configuration</td>
              <td>
                Cloud service configurations you add, including configuration name, provider,
                region, bucket name, Access Key ID, and Access Key Secret
              </td>
              <td>Local browser storage (chrome.storage.local)</td>
            </tr>
            <tr>
              <td>Interface preferences</td>
              <td>
                Language selection, view mode (grid/list), theme, and other interface preferences
              </td>
              <td>Local browser storage (chrome.storage.local)</td>
            </tr>
            <tr>
              <td>Uploaded file content</td>
              <td>
                Files you actively choose to upload to cloud storage, pasted clipboard images, or
                screenshots of the current tab captured via the screenshot feature
              </td>
              <td>Uploaded directly to your configured cloud storage service</td>
            </tr>
          </tbody>
        </table>

        <h2>3. How We Use Information</h2>
        <ul>
          <li>
            <strong>Cloud storage configuration:</strong> Used to connect to the cloud storage
            service you specify, enabling file browsing, upload, download, deletion, moving, and
            link generation.
          </li>
          <li>
            <strong>Interface preferences:</strong> Used to synchronize your interface preferences
            across Extension pages for a consistent experience.
          </li>
          <li>
            <strong>Uploaded file content:</strong> Uploaded to your own configured cloud storage
            bucket according to your explicit actions.
          </li>
        </ul>

        <h2>4. Storage and Security of Information</h2>
        <ul>
          <li>
            <strong>Local encrypted storage:</strong> Your Access Key ID and Access Key Secret
            are encrypted using the AES algorithm within the Extension before being saved to
            <code>chrome.storage.local</code>. Decryption occurs only locally in your browser
            when a cloud service client is created.
          </li>
          <li>
            <strong>Local storage:</strong> All configuration and preference data is stored only
            in your browser locally and is never transmitted to the Extension developer&rsquo;s
            servers.
          </li>
          <li>
            <strong>Direct communication:</strong> The Extension communicates directly with the
            cloud provider APIs you configure, without any third-party proxy servers.
          </li>
          <li>
            <strong>Security recommendation:</strong> Client-side encryption is not a substitute
            for cloud-side access control. We recommend using a dedicated key restricted to the
            required bucket and operations, rotating it regularly, and never using an account
            owner or administrator credential.
          </li>
        </ul>

        <h2>5. Sharing and Disclosure of Information</h2>
        <p>
          The Extension <strong>does not</strong> sell, rent, or share your personal data with any
          third party. Your data is processed only in the following circumstances:
        </p>
        <ul>
          <li>
            <strong>Cloud providers:</strong> When you use the Extension to connect to Aliyun
            OSS, Tencent Cloud COS, or AWS S3, your credentials and file operation requests are
            sent directly to the cloud provider you choose and are subject to that provider&rsquo;s
            own privacy policy.
          </li>
          <li>
            <strong>Legal requirements:</strong> If required by law or a competent authority, we
            may cooperate in providing relevant information to the extent permitted by law.
          </li>
        </ul>

        <h2>6. Permissions</h2>
        <p>The Extension requests the following permissions and explains their purposes:</p>
        <table>
          <thead>
            <tr>
              <th>Permission</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>storage</td>
              <td>
                Store encrypted cloud storage credentials and interface preferences locally in
                the browser
              </td>
            </tr>
            <tr>
              <td>activeTab</td>
              <td>
                Capture the current tab for the screenshot upload feature when you actively
                trigger it
              </td>
            </tr>
            <tr>
              <td>clipboardRead</td>
              <td>Read clipboard images you actively paste for the upload feature</td>
            </tr>
            <tr>
              <td>Content scripts (all web pages)</td>
              <td>
                Inject the cloud drive drawer into web pages and support dragging webpage media
                files for upload
              </td>
            </tr>
            <tr>
              <td>Cloud provider domain access</td>
              <td>
                Communicate directly with the APIs of your configured cloud providers (Aliyun
                OSS, Tencent Cloud COS, AWS S3, etc.)
              </td>
            </tr>
          </tbody>
        </table>

        <h2>7. Data Retention and Deletion</h2>
        <ul>
          <li>
            <strong>Deleting configurations:</strong> You can delete any saved cloud storage
            configuration at any time from the Extension&rsquo;s configuration management interface;
            the corresponding encrypted credentials will be removed from local storage as well.
          </li>
          <li>
            <strong>Uninstalling the Extension:</strong> After uninstalling CloudDock, the
            browser will automatically clear all data stored in <code>chrome.storage.local</code>.
          </li>
          <li>
            <strong>Files in cloud storage:</strong> Files uploaded to your cloud storage bucket
            are managed by you; the Extension does not retain any additional data in your cloud
            storage.
          </li>
        </ul>

        <h2>8. Children&rsquo;s Privacy</h2>
        <p>
          The Extension is not directed to children under 13 years of age (or the lower age
          threshold specified in your jurisdiction) and does not knowingly collect personal
          information from children. If you believe we have inadvertently collected information
          from a child, please contact us using the details below, and we will promptly delete
          the relevant information.
        </p>

        <h2>9. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we make material changes,
          we will update the effective date on this page and publish the revised version.
          We encourage you to review this policy periodically to stay informed about how we
          protect your information.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have any questions, comments, or suggestions regarding this Privacy Policy,
          please contact us through the following channels:
        </p>
        <ul>
          <li>
            Email: <a href="mailto:hongrong2019@gmail.com">hongrong2019@gmail.com</a>
          </li>
        </ul>

        <div className="footer">
          <p>© 2026 CloudDock. All rights reserved.</p>
          <p>This Privacy Policy was last updated on August 11, 2026.</p>
        </div>
      </div>
    </>
  );
}