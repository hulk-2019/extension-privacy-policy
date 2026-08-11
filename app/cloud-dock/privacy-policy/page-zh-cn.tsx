import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CloudDock 隐私权政策",
  description: "CloudDock 浏览器扩展隐私权政策",
};

export default function PrivacyPolicyZhPage() {
  return (
    <>
      <div className="privacy-container">
        <h1>CloudDock 隐私权政策</h1>
        <p className="meta">生效日期：2026 年 8 月 11 日</p>

        <div className="highlight">
          本隐私权政策旨在帮助您了解 CloudDock 浏览器扩展（以下简称&ldquo;本扩展&rdquo;）如何收集、使用、存储和保护您的信息。请在使用本扩展前仔细阅读本政策。
        </div>

        <h2>1. 概述</h2>
        <p>
          CloudDock 是一款浏览器云存储管理工具，允许您在浏览网页的同时浏览、上传、预览、整理和分享您在对象存储服务（如阿里云 OSS、腾讯云 COS、AWS S3）中的文件。
          本扩展遵循&ldquo;本地优先、最小化收集&rdquo;的原则：您的数据默认仅存储在您的浏览器本地，本扩展开发者不会收集、上传或出售您的任何个人数据。
        </p>

        <h2>2. 我们收集的信息</h2>
        <p>本扩展收集以下信息，且仅用于实现其核心功能：</p>
        <table>
          <thead>
            <tr>
              <th>数据类型</th>
              <th>说明</th>
              <th>存储位置</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>云存储配置信息</td>
              <td>您添加的云服务配置，包括配置名称、云服务商、区域、存储桶名称、Access Key ID 和 Access Key Secret</td>
              <td>浏览器本地（chrome.storage.local）</td>
            </tr>
            <tr>
              <td>界面偏好设置</td>
              <td>语言选择、视图模式（网格/列表）、主题等界面偏好</td>
              <td>浏览器本地（chrome.storage.local）</td>
            </tr>
            <tr>
              <td>上传的文件内容</td>
              <td>您主动选择上传到云存储的文件、粘贴的剪贴板图片、或通过截图功能捕获的当前标签页画面</td>
              <td>直接上传至您配置的云存储服务</td>
            </tr>
          </tbody>
        </table>

        <h2>3. 我们如何使用信息</h2>
        <ul>
          <li>
            <strong>云存储配置信息：</strong>
            用于连接您指定的云存储服务，实现文件浏览、上传、下载、删除、移动和链接生成等功能。
          </li>
          <li>
            <strong>界面偏好设置：</strong>
            用于在扩展各页面之间同步您的界面偏好，提供一致的使用体验。
          </li>
          <li>
            <strong>上传的文件内容：</strong>
            按照您的明确操作指令，将文件上传至您自己配置的云存储桶中。
          </li>
        </ul>

        <h2>4. 信息的存储与安全</h2>
        <ul>
          <li>
            <strong>本地加密存储：</strong>
            您的 Access Key ID 和 Access Key Secret 在保存到
            <code>chrome.storage.local</code> 之前，会使用 AES 加密算法在扩展内部进行加密。解密操作仅在您的浏览器本地、创建云服务客户端时进行。
          </li>
          <li>
            <strong>本地存储：</strong>
            所有配置和偏好数据仅保存在您的浏览器本地，不会传输到本扩展开发者的服务器。
          </li>
          <li>
            <strong>直接通信：</strong>
            本扩展直接与您配置的云服务商 API 通信，不经过任何第三方代理服务器。
          </li>
          <li>
            <strong>安全建议：</strong>
            客户端加密不能替代云端的访问控制。建议您使用仅限所需存储桶和操作权限的专用密钥，定期轮换密钥，切勿使用账号所有者或管理员级别的凭证。
          </li>
        </ul>

        <h2>5. 信息的共享与披露</h2>
        <p>
          本扩展<strong>不会</strong>向任何第三方出售、出租或共享您的个人数据。您的数据仅在以下情形下被处理：
        </p>
        <ul>
          <li>
            <strong>云服务商：</strong>
            当您使用本扩展连接阿里云 OSS、腾讯云 COS 或 AWS S3 时，您的凭证和文件操作请求会直接发送给您所选择的云服务商，并受该服务商自身隐私政策的约束。
          </li>
          <li>
            <strong>法律要求：</strong>
            如法律法规或有权机关依法要求，我们可能需要在法律允许的范围内配合提供相关信息。
          </li>
        </ul>

        <h2>6. 权限说明</h2>
        <p>本扩展申请以下权限，并说明其用途：</p>
        <table>
          <thead>
            <tr>
              <th>权限</th>
              <th>用途</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>storage</td>
              <td>在浏览器本地保存加密的云存储凭证和界面偏好设置</td>
            </tr>
            <tr>
              <td>activeTab</td>
              <td>在您主动触发时捕获当前标签页画面用于截图上传功能</td>
            </tr>
            <tr>
              <td>clipboardRead</td>
              <td>读取您主动粘贴的剪贴板图片，用于上传功能</td>
            </tr>
            <tr>
              <td>内容脚本（所有网页）</td>
              <td>在网页中注入云盘抽屉界面，支持拖拽网页媒体文件上传</td>
            </tr>
            <tr>
              <td>云服务商域名访问</td>
              <td>与您配置的阿里云 OSS、腾讯云 COS、AWS S3 等云服务 API 直接通信</td>
            </tr>
          </tbody>
        </table>

        <h2>7. 数据保留与删除</h2>
        <ul>
          <li>
            <strong>删除配置：</strong>
            您可以在扩展的配置管理界面中随时删除已保存的云存储配置，对应的加密凭证将一并从本地删除。
          </li>
          <li>
            <strong>卸载扩展：</strong>
            卸载 CloudDock 后，浏览器会自动清除扩展存储在 <code>chrome.storage.local</code> 中的所有数据。
          </li>
          <li>
            <strong>云存储中的文件：</strong>
            上传至您云存储桶中的文件由您自行管理，本扩展不会在您的云存储中保留任何额外数据。
          </li>
        </ul>

        <h2>8. 儿童隐私</h2>
        <p>
          本扩展不面向 13 周岁以下（或您所在司法辖区规定的更低年龄）的儿童，也不会故意收集儿童的个人信息。
          如果您认为我们无意中收集了儿童的信息，请通过下方联系方式与我们联系，我们将及时删除相关信息。
        </p>

        <h2>9. 隐私政策的变更</h2>
        <p>
          我们可能会不时更新本隐私权政策。当政策发生重大变更时，我们会在本页面更新生效日期并发布修订版本。
          建议您定期查看本政策以了解我们如何保护您的信息。
        </p>

        <h2>10. 联系我们</h2>
        <p>如果您对本隐私权政策有任何疑问、意见或建议，请通过以下方式联系我们：</p>
        <ul>
          <li>
            电子邮箱：
            <a href="mailto:hongrong2019@gmail.com">hongrong2019@gmail.com</a>
          </li>
        </ul>

        <div className="footer">
          <p>© 2026 CloudDock. 保留所有权利。</p>
          <p>本隐私权政策最后更新于 2026 年 8 月 11 日。</p>
        </div>
      </div>
    </>
  );
}