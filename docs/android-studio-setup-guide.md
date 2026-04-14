# Android Studio 安装与配置指南

> 本文档对应 Phase 0 任务 5.1，指导你完成 Android Studio 的安装、SDK 配置和模拟器创建。

---

## 目录

1. [安装 Android Studio](#1-安装-android-studio)
2. [配置 Android SDK](#2-配置-android-sdk)
3. [创建 Android 模拟器](#3-创建-android-模拟器)
4. [配置环境变量](#4-配置环境变量)
5. [验证安装](#5-验证安装)
6. [React Native 环境补充](#6-react-native-环境补充)

---

## 1. 安装 Android Studio

### 步骤

1. 你已经下载了 **Android Studio Panda 3 (2025.3.3)**，双击安装文件运行
2. 安装向导中：
   - **Install Type**：选择 **Standard**（会自动安装推荐的 SDK 组件）
   - **UI Theme**：选你喜欢的（Dark / Light）
   - **SDK Components Setup**：确保以下都勾选了：
     - ✅ Android SDK
     - ✅ Android SDK Platform
     - ✅ Android Virtual Device
   - **安装路径**：默认即可（通常是 `C:\Users\<你的用户名>\AppData\Local\Android\Sdk`）
3. 点击 **Finish**，等待组件下载安装完成（需要联网，可能需要几分钟）

### 首次启动

安装完成后启动 Android Studio，它会运行 **Setup Wizard**：
- 如果提示导入设置：选 **Do not import settings**
- 等待 SDK 组件自动下载完成

---

## 2. 配置 Android SDK

### 打开 SDK Manager

1. 在 Android Studio 欢迎页，点击 **More Actions**（或菜单 **Tools** → **SDK Manager**）
2. 或者打开后进入 **File** → **Settings** → **Languages & Frameworks** → **Android SDK**

### 安装 SDK Platform

在 **SDK Platforms** 标签页：

| 勾选项 | 说明 |
|--------|------|
| ✅ **Android 14.0 (UpsideDownCake)**，API Level **34** | React Native 推荐的 target SDK |
| ✅ **Android 15.0 (VanillaIceCream)**，API Level **35** | 可选，最新版本 |

> 💡 至少安装 **API 34**，这是当前 React Native 社区最稳定的版本。

### 安装 SDK Tools

切换到 **SDK Tools** 标签页，确保以下工具已勾选：

| 工具 | 说明 |
|------|------|
| ✅ **Android SDK Build-Tools** | 构建必需 |
| ✅ **Android SDK Command-line Tools (latest)** | adb 等命令行工具 |
| ✅ **Android Emulator** | 模拟器运行环境 |
| ✅ **Android SDK Platform-Tools** | adb、fastboot 等 |
| ✅ **Intel HAXM** 或 **Android Emulator Hypervisor Driver** | 模拟器硬件加速（⚠️ 重要！） |

> ⚠️ **关于硬件加速**：
> - 如果你的 CPU 是 **Intel**：安装 **Intel HAXM**
> - 如果你的 CPU 是 **AMD**：不需要 HAXM，需确保 Windows **Hyper-V** 已启用（通常默认开启）
> - 如果你的电脑已开启 **WSL2/Hyper-V**：选择 **Android Emulator Hypervisor Driver (installer)**

点击 **Apply** → **OK**，等待下载安装。

---

## 3. 创建 Android 模拟器

### 打开 AVD Manager

1. 在 Android Studio 中：**Tools** → **Device Manager**
2. 或者在欢迎页：**More Actions** → **Virtual Device Manager**

### 创建虚拟设备

1. 点击 **Create Virtual Device**
2. **选择设备**：
   - Category: **Phone**
   - 选择 **Pixel 7**（或 Pixel 8，都可以）
   - 点击 **Next**
3. **选择系统镜像**：
   - 切换到 **Recommended** 标签
   - 选择 **UpsideDownCake**（API 34，Android 14）
   - 如果显示 **Download**，点击下载（约 1.5GB）
   - 下载完成后选中它，点击 **Next**
4. **配置 AVD**：
   - **AVD Name**：保持默认或改为 `Pixel_7_API_34`
   - 其他设置保持默认即可
   - 点击 **Finish**

### 启动模拟器

- 在 Device Manager 中，找到刚创建的设备，点击 ▶️ **播放按钮**启动
- 首次启动较慢（1~3 分钟），等待 Android 系统完全启动
- 看到 Android 主屏幕就表示成功了

---

## 4. 配置环境变量

React Native 需要以下环境变量才能找到 Android SDK。

### 设置 ANDROID_HOME

1. 按 `Win + S` 搜索 **"环境变量"** → 点击 **"编辑系统环境变量"**
2. 点击 **"环境变量"** 按钮
3. 在 **"用户变量"** 区域：
   - 点击 **"新建"**
   - 变量名：`ANDROID_HOME`
   - 变量值：`C:\Users\<你的用户名>\AppData\Local\Android\Sdk`
     （替换 `<你的用户名>` 为实际值）
   - 点击 **确定**

### 添加 platform-tools 到 PATH

1. 在 **"用户变量"** 区域找到 `Path`，双击编辑
2. 点击 **"新建"**，添加以下路径（每行一个）：

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

3. 点击 **确定** 保存所有对话框

### ⚠️ 重要：重启终端

设置环境变量后，**必须关闭所有终端窗口并重新打开**，新变量才会生效。Codebuddy 的终端也需要重启。

---

## 5. 验证安装

### 重新打开一个终端窗口，依次执行以下命令：

**检查 ANDROID_HOME：**
```powershell
echo $env:ANDROID_HOME
```
应输出你的 SDK 路径，如 `C:\Users\xxx\AppData\Local\Android\Sdk`

**检查 adb：**
```powershell
adb --version
```
应显示 adb 版本信息，如 `Android Debug Bridge version 1.0.41`

**检查连接设备/模拟器：**
```powershell
adb devices
```
- 如果模拟器正在运行，应显示类似：
  ```
  List of devices attached
  emulator-5554   device
  ```
- 如果没有运行模拟器，显示空列表是正常的

**检查 Java（React Native 需要）：**
```powershell
java -version
```
Android Studio Panda 3 自带 JDK 21，但 React Native 可能需要 JDK 17。如果 `java` 命令不可用，参见下面第 6 节。

### 验收标准

- [x] `echo $env:ANDROID_HOME` 输出正确的 SDK 路径
- [x] `adb --version` 正常输出版本
- [x] `adb devices` 可以列出模拟器或真机
- [x] 模拟器启动后能看到 Android 主屏幕

---

## 6. React Native 环境补充

### JDK 配置

React Native 需要 **JDK 17**。Android Studio Panda 3 内置了 JDK，但可能没有加到系统 PATH。

**推荐方式**：使用 Android Studio 内置的 JDK：

1. 找到 Android Studio 内置 JDK 路径，通常在：
   ```
   C:\Program Files\Android\Android Studio\jbr
   ```
2. 添加环境变量：
   - 变量名：`JAVA_HOME`
   - 变量值：`C:\Program Files\Android\Android Studio\jbr`
3. 在 `Path` 中添加：`%JAVA_HOME%\bin`

**验证：**
```powershell
java -version
```
应显示版本 17 或更高。

### 常见问题排查

| 问题 | 解决方案 |
|------|---------|
| `adb` 命令未找到 | 检查 `%ANDROID_HOME%\platform-tools` 是否在 PATH 中；重启终端 |
| 模拟器启动后黑屏 | 进入 BIOS 开启 VT-x / AMD-V 虚拟化；检查 HAXM 或 Hyper-V 是否启用 |
| 模拟器极慢 | 确认硬件加速已开启；增加模拟器 RAM（AVD 设置中调整） |
| Gradle 构建失败找不到 SDK | 确认 `ANDROID_HOME` 环境变量设置正确 |
| `java` 命令未找到 | 设置 `JAVA_HOME` 指向 Android Studio 内置 JDK |

---

## 完成后

所有验证通过后回来告诉我，我会继续执行：

- **5.2** 初始化 React Native 项目
- **5.3** 配置 Metro 解析 monorepo
- **5.4** 接入 Supabase 客户端
- **5.5** 编写 CRUD 验证页面
- **5.6** 验证 Realtime 订阅

这些代码任务我会一口气帮你完成！ 🚀
