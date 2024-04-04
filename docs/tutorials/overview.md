---
id: tutorials-overview
slug: overview
title: 教程概览
sidebar_label: 教程概览
hide_title: true
---

import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

&nbsp;

# 教程概览

**Redux核心文档网站[redux.js.org](https://cn.redux.js.org)包含了学习Redux的主要教程**，包括如何将Redux Toolkit和React-Redux一起使用。

:::tip

为了避免在Redux核心和Redux Toolkit文档之间重复解释，我们专注于使Redux核心文档的教程全面，而不是在Redux Toolkit文档中有扩展的教程。

:::

参考这些链接的教程，学习如何有效地使用Redux Toolkit。

## Redux Toolkit快速入门

[**Redux Toolkit快速入门教程**](./quick-start.mdx)简要介绍了如何在React应用程序中添加和使用Redux Toolkit。

**如果你只想快速运行一个基本示例，阅读快速入门教程。**

我们还有一个[**TypeScript快速入门教程**](./typescript.md)，简要介绍了如何使用Redux Toolkit和React-Redux设置和使用TypeScript。

如果你正在使用Next.js，我们有一个专门针对使用Redux Toolkit与Next.js的教程[**Next.js教程**](../usage/nextjs.mdx)。

## Redux基础知识：一个真实世界的例子

[**Redux基础教程**](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)教你"如何正确使用Redux"，使用Redux Toolkit作为编写Redux逻辑的标准方法。

它展示了如何构建一个"真实世界"风格的示例应用程序，并在此过程中教授Redux概念。

**如果你从未使用过Redux，只想知道"我如何使用这个来构建一些有用的东西？"，从Redux基础教程开始。**

## Redux基础知识：从零开始的Redux

[**Redux基础教程**](https://redux.js.org/tutorials/fundamentals/part-1-overview)通过展示如何手动编写Redux代码以及为什么存在标准使用模式来教授"Redux如何从底层工作"。然后它展示了Redux Toolkit如何简化这些Redux使用模式。

由于Redux Toolkit是一个包裹在Redux核心周围的抽象层，所以了解RTK的API实际上为你做了什么是有帮助的。**如果你想理解Redux真正如何工作，以及为什么RTK是推荐的方法，请阅读Redux基础教程。**

## 学习现代Redux直播

Redux维护者Mark Erikson出现在"Learn with Jason"节目中，解释我们今天推荐使用Redux的方式。该节目包括一个现场编码的示例应用，展示了如何使用Redux Toolkit和React-Redux钩子与Typescript，以及新的RTK Query数据获取API。

查看[“学习现代Redux”节目笔记页面](https://www.learnwithjason.dev/let-s-learn-modern-redux)以获取成绩单和示例应用源的链接。

<LiteYouTubeEmbed
    id="9zySeP5vH9c"
    title="学习现代Redux - Redux Toolkit, React-Redux Hooks, 和 RTK Query"
/>


## 使用Redux Toolkit

RTK的[**使用指南**文档页面](../usage/usage-guide.md)解释了RTK的每个API的标准使用模式。[API参考](../api/configureStore.mdx)部分描述了每个API函数，并提供了额外的使用示例。

[Redux基础教程](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)也展示了如何在构建应用程序时使用每个API。

## RTK Query视频课程

如果你更喜欢视频课程，你可以[在Egghead免费观看由RTK Query的创建者Lenz Weber-Tronic制作的RTK Query视频课程](https://egghead.io/courses/rtk-query-basics-query-endpoints-data-flow-and-typescript-57ea3c43?af=7pnhj6)，或者在这里看第一课：

<div style={{position:"relative",paddingTop:"56.25%"}}>
  <iframe
    src="https://app.egghead.io/lessons/redux-course-introduction-and-application-walk-through-for-rtk-query-basics/embed?af=7pnhj6"
    title="在Egghead的RTK Query视频课程：课程介绍和RTK Query基础应用演示"
    frameborder="0"
    allowfullscreen
    style={{position:"absolute",top:0,left:0,width:"100%",height:"100%"}}
  ></iframe>
</div>

## 将Vanilla Redux迁移到Redux Toolkit

如果你已经了解Redux，只想知道如何将现有的应用程序迁移到Redux Toolkit，[**"Redux基础教程中的现代Redux与Redux Toolkit"页面**](https://redux.js.org/tutorials/fundamentals/part-8-modern-redux)展示了RTK的API如何简化Redux的使用模式，以及如何处理这种迁移。

## 使用Redux Toolkit与TypeScript

RTK文档中的[**与TypeScript一起使用**](../usage/usage-with-typescript.md)页面展示了如何设置Redux Toolkit与TypeScript和React的基本模式，并记录了每个RTK API的特定TS模式。

此外，[Redux + TS的Create-React-App模板](https://github.com/reduxjs/cra-template-redux-typescript)已经配置了RTK，以使用这些TS模式，可以作为一个好的示例来展示这应该如何工作。

## 旧版Redux Toolkit教程

我们之前在Redux Toolkit文档中有一套"基础/中级/高级"教程。它们很有帮助，但我们已经移除了它们，转而指向Redux核心文档中的"基础"和"基本原理"教程。

如果你想浏览旧教程，你可以在我们的仓库历史中查看内容文件：

[Redux Toolkit仓库：旧版"基础/中级/高级"教程文件](https://github.com/reduxjs/redux-toolkit/tree/e85eb17b39/docs/tutorials)
