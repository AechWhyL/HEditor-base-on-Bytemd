<script setup lang="js">

// svgs
import BoldIcon from '@/statics/svgs/bold.svg?component'
import CodeBlockIcon from '@/statics/svgs/code-block.svg?component'
import CodeInlineIcon from '@/statics/svgs/code-inline.svg?component'
import DoubleQuotesIcon from '@/statics/svgs/double-quotes-left.svg?component'
import HeadingH1Icon from '@/statics/svgs/heading-h1.svg?component'
import HeadingH2Icon from '@/statics/svgs/heading-h2.svg?component'
import HeadingH3Icon from '@/statics/svgs/heading-h3.svg?component'
import HeadingH4Icon from '@/statics/svgs/heading-h4.svg?component'
import HeadingIcon from '@/statics/svgs/heading.svg?component'
import ImageIcon from '@/statics/svgs/image.svg?component'
import ItalicIcon from '@/statics/svgs/italic.svg?component'
import LinkIcon from '@/statics/svgs/link.svg?component'
import ListCheckedIcon from '@/statics/svgs/list-checked.svg?component'
import ListDisorderIcon from '@/statics/svgs/list-disorder.svg?component'
import StrikeThroughIcon from '@/statics/svgs/strikethrough.svg?component'
import TableIcon from '@/statics/svgs/table.svg?component'
import TocIcon from '@/statics/svgs/toc.svg?component'
import FullScreenIcon from '@/statics/svgs/fullscreen.svg?component'
import CompressIcon from '@/statics/svgs/compress.svg?component'
import OnlyEditorIcon from '@/statics/svgs/onlyEditor.svg?component'
import OnlyPreIcon from '@/statics/svgs/onlyPreview.svg?component'

import '@/themes/vueStyle.css'
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';

// unist.js
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import { visit } from 'unist-util-visit'

// codemirror.js
import { minimalSetup } from "codemirror";
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, highlightSpecialChars, } from "@codemirror/view"
import { defaultKeymap } from "@codemirror/commands"
import { ref, watch, onMounted, computed } from 'vue'
import tippy from 'tippy.js'

// lodash.js
import { debounce } from 'lodash'

const editorHolder = `# Pluto

Pluto is an dwarf planet in the Kuiper belt.

## Contents
![微信图片_20240426151507.jpg](http://124.222.4.30:4000/i/2024/07/10/668e228edccc2.jpg)
## History

### Discovery

In the 1840s, Urbain Le Verrier used Newtonian mechanics to predict the

position of…

### Name and symbol

The name Pluto is for the Roman god of the underworld, from a Greek epithet for
Hades…

### Planet X disproved

Once Pluto was found, its faintness and lack of a viewable disc cast doubt…

## Orbit

Pluto’s orbital period is about 248 years…`


// dataRefs
const html = ref('')
const md = ref('')
const tocVisible = ref(false)
const tocData = ref([])
const syncScrollingEnabled = ref(true)
const curScrollingArea = ref("")
const headerVisible = ref(true)
const isFullscreen = ref(false)
const editorVisible = ref(true)
const previewVisible = ref(true)


// templateRefs
const previewAreaRef = ref(null)
const editorAreaRef = ref(null)
const htmlAreaRef = ref(null)

const sideBarVisible = computed(() => {
    return tocVisible.value
})

const onlyEditorActive = computed(() => {
    return editorVisible.value && !previewVisible.value
})

const onlyPreActive = computed(() => {
    return !editorVisible.value && previewVisible.value
})

const previewAreaStyle = computed(() => {
    if (!previewVisible.value) {
        return `display:none`
    }
    else if (!editorVisible.value) {
        if (sideBarVisible.value) {
            return `width:calc(100% - 280px)`
        } else {
            return `width:100%`
        }
    }
    else {
        if (sideBarVisible.value) {
            return `width:calc(50% - 140px)`
        } else {
            return `width:50%`
        }
    }
})

const editorAreaStyle = computed(() => {
    if (!editorVisible.value) {
        return `display:none`
    }
    else if (!previewVisible.value) {
        if (sideBarVisible.value) {
            return `width:calc(100% - 280px)`
        } else {
            return `width:100%`
        }
    }
    else {
        if (sideBarVisible.value) {
            return `width:calc(50% - 140px)`
        } else {
            return `width:50%`
        }
    }
})

// globals
const tooltipContents = [
    "加粗",      // index 0
    "斜体",      // index 1
    "引用",      // index 2
    "链接",      // index 3
    "代码块",    // index 4
    "行内代码",  // index 5
    "无序列表",   // index 6
    "删除线",     // index 7
    "标题", // index 8
    "表格",  // index 9
    "图片",  // index 10
    "目录", // index 11 
    "全屏", // index 12
    "退出全屏", // index 13
    "仅编辑区", // index 14
    "仅预览区", // index 15
]

const activeTooltipContents = [
    "加粗",      // index 0
    "斜体",      // index 1
    "引用",      // index 2
    "链接",      // index 3
    "代码块",    // index 4
    "行内代码",  // index 5
    "无序列表",   // index 6
    "删除线",     // index 7
    "标题", // index 8
    "表格",  // index 9
    "图片",  // index 10
    "目录", // index 11 
    "全屏", // index 12
    "退出全屏", // index 13
    "还原默认", // index 14
    "还原默认", // index 15
]

let cmView = null
let unistTreeNodes = []
let unistTreeTops = []
let previewDomTops = []
let unistHeadingTops = []

function generateToc() {
    return function (tree) {
        const headings = []
        const headingTops = []
        visit(tree, "heading", (node) => {
            headings.push({
                depth: node.depth,
                content: node.children[0].value,
                active: false
            })
            const pos = node.position.start.offset
            const blogInfo = cmView.lineBlockAt(pos)
            headingTops.push(blogInfo.top)
        })
        tocData.value = [...headings]
        unistHeadingTops = [...headingTops]
    }
}

function getUnistTree() {
    return function (tree) {
        unistTreeNodes = tree.children
    }
}

const uniProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(generateToc)
    .use(getUnistTree)
    .use(remarkRehype)
    .use(rehypeStringify)

function md2HTML(mdText) {
    return uniProcessor.processSync(mdText)
}

watch(md, (newText, oldText) => {
    html.value = md2HTML(newText)
    updateTocActive()
})

function makeBold() {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    console.log(from, to)
    let transaction = null;
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: cmView.state.doc.length, insert: `**新建粗体**` },
            selection: { anchor: from + 2, head: from + 2 + 4 }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from, to, insert: `**${selectedText}**` },
            selection: { anchor: from + 2, head: from + 2 + selectedText.length }
        })
    }
    cmView.dispatch(transaction)
}

function makeItalic() {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    console.log(from, to)
    let transaction = null;
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: cmView.state.doc.length, insert: `*新建斜体*` },
            selection: { anchor: from + 1, head: from + 1 + 4 }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from, to, insert: `*${selectedText}*` },
            selection: { anchor: from + 1, head: from + 1 + selectedText.length }
        })
    }
    cmView.dispatch(transaction)
}

function makeQuote() {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    console.log(from, to)
    let transaction = null;
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: cmView.state.doc.length, insert: `> 新建引用` },
            selection: { anchor: from + 2, head: from + 2 + 4 }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from, to, insert: `> ${selectedText}` },
            selection: { anchor: from + 2, head: from + 2 + selectedText.length }
        })
    }
    cmView.dispatch(transaction)
}

function makeLink() {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    console.log(from, to)
    let transaction = null;
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: cmView.state.doc.length, insert: `[](url)` },
            selection: { anchor: from + 3, head: from + 3 + 3 }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from, to, insert: `[${selectedText}](url)` },
            selection: { anchor: from + 1 + selectedText.length + 2, head: from + 2 + selectedText.length + 2 + 3 }
        })
    }
    cmView.dispatch(transaction)
}

function makeCode() {
    const defaultLanguage = "javascript"
    const codeArea = `\n\`\`\`${defaultLanguage}
        
\`\`\`\n`
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    const { to: lineEnd } = cmView.state.doc.lineAt(from)
    let transaction = null;
    cmView.focus()
    transaction = cmView.state.update({
        changes: { from: lineEnd, to: lineEnd, insert: codeArea },
        selection: { anchor: lineEnd + 4, head: lineEnd + 4 + defaultLanguage.length }
    })
    cmView.dispatch(transaction)
}

function makeTable() {
    const tableArea = `  \n| 标题 |  |
| :---: | :---: |
|  |  |`
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    const { to: lineEnd } = cmView.state.doc.lineAt(from)
    console.log(from, to)
    let transaction = null;
    cmView.focus()
    transaction = cmView.state.update({
        changes: { from: lineEnd, to: lineEnd, insert: tableArea },
        selection: { anchor: lineEnd + 5, head: lineEnd + 5 + 2 }
    })
    cmView.dispatch(transaction)
}

async function makeImg(img) {
    const { default: axios } = await import('axios')
    axios.postForm('http://124.222.4.30:4000/api/v1/upload', {
        file: img
    }).then((res) => {
        const { markdown } = res.data.data.links
        const selection = cmView.state.selection.main
        const { from, to } = selection;
        const { to: lineEnd } = cmView.state.doc.lineAt(from)
        let transaction = null;
        cmView.focus()
        if (from == to && from == lineEnd) {
            transaction = cmView.state.update({
                changes: { from, to, insert: `${markdown}` },
            })
        } else {
            transaction = cmView.state.update({
                changes: { from: lineEnd, to: lineEnd, insert: `\n${markdown}` },
            })
        }
        cmView.dispatch(transaction)
    }).catch((err) => {
        console.log(err)
    })
}

function makeUl() {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    const { from: lineStart, to: lineEnd } = cmView.state.doc.lineAt(from)
    console.log(lineStart, lineEnd)
    let transaction = null;
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: cmView.state.doc.length, insert: `- ` },
            selection: { anchor: lineStart, head: lineStart + 2 }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from: lineStart, insert: `- ` },
            selection: { anchor: lineStart, head: lineEnd + 2 }
        })
    }
    cmView.dispatch(transaction)
}

function makeInlineCode() {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    console.log(from, to)
    let transaction = null;
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: from, to: from, insert: `\`行内代码\`` },
            selection: {
                anchor: from + 1, head: from + 1 + 4
            }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from, to, insert: `\`${selectedText}\`` },
            selection: { anchor: from + 1, head: from + 1 + selectedText.length }
        })
    }
    cmView.dispatch(transaction)
}

function makeStrikeThrough() {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    console.log(from, to)
    let transaction = null;
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: cmView.state.doc.length, insert: `~~新建删除线~~` },
            selection: { anchor: from + 2, head: from + 2 + 5 }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from, to, insert: `~~${selectedText}~~` },
            selection: { anchor: from + 2, head: from + 2 + selectedText.length }
        })
    }
    cmView.dispatch(transaction)
}

function createTooltips() {
    const nodeList = document.querySelectorAll('[data-tippy-icon]')
    nodeList.forEach((node) => {
        const dropdown = node.querySelector('.tools-dropdown')
        const theme = dropdown ? 'light-border' : ''
        tippy(node, {
            content: (ref) => {
                if (dropdown) {
                    return dropdown
                }
                const path = ref.getAttribute('data-tippy-tooltip-path')
                return tooltipContents[path]
            },
            duration: 100,
            interactive: dropdown ? true : false,
            theme: theme,
            appendTo: document.body,
        })
    })
}

function makeTitle(level) {
    const selection = cmView.state.selection.main
    const { from, to } = selection;
    const { from: lineStart, to: lineEnd } = cmView.state.doc.lineAt(from)
    let transaction = null;
    console.log(lineStart, lineEnd)
    if (from >= to) {
        cmView.focus()
        transaction = cmView.state.update({
            changes: { from: lineStart, to: lineEnd, insert: `${'#'.repeat(level)} ` },
            selection: { anchor: lineStart, head: lineStart + level + 1 }
        })
    } else {
        cmView.focus()
        const selectedText = cmView.state.sliceDoc(from, to)
        transaction = cmView.state.update({
            changes: { from: lineStart, to: lineEnd, insert: `${'#'.repeat(level)} ${selectedText}` },
            selection: { anchor: lineStart, head: lineStart + level + 1 + selectedText.length }
        })
    }
    cmView.dispatch(transaction)
}

function createCodemirrorEditor() {
    const update = (update) => {
        if (update.selectionSet || update.selectionSet) {
            if (!update.docChanged) {
                return
            }
        }
        if (update.changes) {
            md.value = update.state.doc.toString();
        }
    }

    const debounceUpdate = debounce(update, 400)
    let cmState = EditorState.create({
        doc: editorHolder,
        extensions: [
            keymap.of(defaultKeymap),
            EditorView.lineWrapping,
            minimalSetup,
            highlightSpecialChars(),
            EditorView.updateListener.of(debounceUpdate),
            EditorView.domEventHandlers({
                scroll: onEditorScroll
            })
        ]
    })

    cmView = new EditorView({
        state: cmState,
        lineWrapping: true,
        parent: document.querySelector('#codemirror-editor-root')
    })
}

function toggleTocVisible() {
    tocVisible.value = !tocVisible.value
}

function scrollToTile(index) {
    curScrollingArea.value = 'editor'
    editorAreaRef.value.scrollTop = unistHeadingTops[index] + 1
}

function computeScrollPos() {
    const previewAreaNodes = htmlAreaRef.value.childNodes
    unistTreeTops = []
    previewDomTops = []
    unistTreeNodes.forEach((node) => {
        const pos = node.position.start.offset
        const blogInfo = cmView.lineBlockAt(pos)
        unistTreeTops.push(blogInfo.top)
    })
    previewAreaNodes.forEach((node) => {
        if (node.nodeType === 1 && node.nodeName !== "text") {
            previewDomTops.push(node.offsetTop)
        }
    })
}

function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
}

function onOnlyEditorClick(e) {
    const tippy = e.currentTarget._tippy
    editorVisible.value = true
    previewVisible.value = !previewVisible.value
    if (!previewVisible.value) {
        tippy.setContent('还原默认')
    } else {
        tippy.setContent('仅预览区')
    }
}

function togEditorVisible() {
    previewVisible.value = true
    editorVisible.value = !editorVisible.value
}

function onImgInputChange(e) {
    const imgFile = e.target.files[0]
    imgFile && makeImg(imgFile)
}

function onEditorScroll(e) {
    updateTocActive()
    if (curScrollingArea.value !== "editor") {
        return
    }
    const editorScrollTop = e.target.scrollTop
    const eidtorScrollHeight = e.target.scrollHeight
    const previewScrollHeight = previewAreaRef.value.scrollHeight
    const editorClientHeight = e.target.clientHeight
    if (editorScrollTop >= eidtorScrollHeight - editorClientHeight) {
        console.log("到底")
        previewAreaRef.value.scrollTop = previewScrollHeight
        return
    } else if (editorScrollTop === 0) {
        console.log("到顶")
        previewAreaRef.value.scrollTop = 0
    }
    computeScrollPos()
    let index = 0
    for (let i = 0; i < unistTreeTops.length; i++) {
        if (unistTreeTops[i] >= editorScrollTop) {
            index = i - 1
            break
        }
    }
    //节点内滚动的offset
    const offset = editorScrollTop - unistTreeTops[index]
    const editorNodeHeight = unistTreeTops[index + 1] - unistTreeTops[index]
    const previewNodeHeight = previewDomTops[index + 1] - previewDomTops[index]
    previewAreaRef.value.scrollTop = previewDomTops[index] + offset * previewNodeHeight / editorNodeHeight
}

function onPreviewScroll(e) {
    if (curScrollingArea.value !== "preview") {
        return
    }
    const previewScrollTop = e.target.scrollTop
    const previewScrollHeight = e.target.scrollHeight
    const editorScrollHeight = editorAreaRef.value.scrollHeight
    const previewClientHeight = e.target.clientHeight
    if (previewScrollTop >= previewScrollHeight - previewClientHeight) {
        console.log("到底")
        editorAreaRef.value.scrollTop = editorScrollHeight
        return
    } else if (previewScrollTop === 0) {
        console.log("到顶")
        editorAreaRef.value.scrollTop = 0
        return
    }
    computeScrollPos()
    let index = 0
    for (let i = 0; i < previewDomTops.length; i++) {
        if (previewDomTops[i] >= previewScrollTop) {
            index = i - 1
            break
        }
    }
    //节点内滚动的offset
    const offset = previewScrollTop - previewDomTops[index]
    const editorNodeHeight = unistTreeTops[index + 1] - unistTreeTops[index]
    const previewNodeHeight = previewDomTops[index + 1] - previewDomTops[index]
    editorAreaRef.value.scrollTop = unistTreeTops[index] + offset * editorNodeHeight / previewNodeHeight
}

const debOnPreviewScroll = debounce(onPreviewScroll, 100)

function updateTocActive() {
    const editorScrollTop = editorAreaRef.value.scrollTop
    let activeHeadingIndex = 0
    for (let i = 0; i < tocData.value.length; i++) {
        console.log(unistHeadingTops[i], editorScrollTop)
        if (unistHeadingTops[i] > editorScrollTop) {
            activeHeadingIndex = i - 1
            break
        }
    }
    console.log(activeHeadingIndex)
    tocData.value.forEach((item, index) => {
        item.active = index === activeHeadingIndex
    })
}

onMounted(() => {
    createTooltips()
    createCodemirrorEditor()
})

</script>

<template>
    <div class="markdown-editor">
        <div class="editor-header" v-show="!isFullscreen">
            <input class="title-input" placeholder="输入标题">
        </div>
        <div class="tools">
            <div data-tippy-icon class="tools-item heading" data-tippy-tooltip-index="8">
                <HeadingIcon class="tool-icon heading-icon" />
                <div class="tools-dropdown">
                    <div class="tools-dropdown-item" @click="makeTitle(1)" data-tippy-tooltip-path="8-0">
                        <HeadingH1Icon class="tools-dropdown-item-icon" />
                        <div class="tools-dropdown-item-title">一级标题</div>
                    </div>
                    <div class="tools-dropdown-item" @click="makeTitle(2)" data-tippy-tooltip-path="8-1">
                        <HeadingH2Icon class="tools-dropdown-item-icon" />
                        <div class="tools-dropdown-item-title">二级标题</div>
                    </div>
                    <div class="tools-dropdown-item" @click="makeTitle(3)" data-tippy-tooltip-path="8-2">
                        <HeadingH3Icon class="tools-dropdown-item-icon" />
                        <div class="tools-dropdown-item-title">三级标题</div>
                    </div>
                    <div class="tools-dropdown-item" @click="makeTitle(4)" data-tippy-tooltip-path="8-3">
                        <HeadingH4Icon class="tools-dropdown-item-icon" />
                        <div class="tools-dropdown-item-title">四级标题</div>
                    </div>
                </div>
            </div>
            <div data-tippy-icon class="tools-item bold" data-tippy-tooltip-path="0" @click="makeBold">
                <BoldIcon class="tool-icon bold-icon" />
            </div>
            <div data-tippy-icon class="tools-item italic" data-tippy-tooltip-path="1" @click="makeItalic">
                <ItalicIcon class="tool-icon italic-icon" />
            </div>
            <div data-tippy-icon class="tools-item quote" data-tippy-tooltip-path="2" @click="makeQuote">
                <DoubleQuotesIcon class="tool-icon quote-icon" />
            </div>
            <div data-tippy-icon class="tools-item link" data-tippy-tooltip-path="3" @click="makeLink">
                <LinkIcon class="tool-icon link-icon" />
            </div>
            <div data-tippy-icon class="tools-item code" data-tippy-tooltip-path="4" @click="makeCode">
                <CodeBlockIcon class="tool-icon code-block-icon" />
            </div>
            <div data-tippy-icon class="tools-item code" data-tippy-tooltip-path="5" @click="makeInlineCode">
                <CodeInlineIcon class="tool-icon code-inline-icon" />
            </div>
            <div data-tippy-icon class="tools-item ul" data-tippy-tooltip-path="6" @click="makeUl">
                <ListDisorderIcon class="tool-icon ul-icon" />
            </div>
            <div data-tippy-icon class="tools-item strikethrough" data-tippy-tooltip-path="7"
                @click="makeStrikeThrough">
                <StrikeThroughIcon class="tool-icon strikethrough-icon" />
            </div>
            <div data-tippy-icon class="tools-item table" data-tippy-tooltip-path="9" @click="makeTable">
                <TableIcon class="tool-icon table-icon" />
            </div>
            <div data-tippy-icon class="tools-item img" data-tippy-tooltip-path="10" @click="makeImg">
                <label for="img-upload" style="display:inline-flex; cursor: pointer;">
                    <ImageIcon class="tool-icon img-icon" />
                </label>
            </div>
            <input id="img-upload" type="file" @change="onImgInputChange" accept="image/*" style="opacity: 0;">
            <div class="flex-grow"></div>
            <div data-tippy-icon class="tools-item toc" :class="{ iconActive: tocVisible }" data-tippy-tooltip-path="11"
                @click="toggleTocVisible">
                <TocIcon class="tool-icon toc-icon" />
            </div>
            <div data-tippy-icon class="tools-item only-editor" data-tippy-tooltip-path="14" @click="onOnlyEditorClick">
                <OnlyEditorIcon class="tool-icon only-editor-icon" />
            </div>
            <div data-tippy-icon class="tools-item only-pre" data-tippy-tooltip-path="15" @click="togEditorVisible">
                <OnlyPreIcon class="tool-icon only-pre-icon" />
            </div>
            <div v-show="!isFullscreen" data-tippy-icon class="tools-item fullscreen" data-tippy-tooltip-path="12"
                @click="toggleFullscreen">
                <FullScreenIcon class="tool-icon fullscreen-icon" />
            </div>
            <div v-show="isFullscreen" data-tippy-icon class="tools-item compress" data-tippy-tooltip-path="13"
                @click="toggleFullscreen">
                <CompressIcon class="tool-icon compress-icon" />
            </div>
        </div>
        <div class="editor-split">
            <div id="codemirror-editor-root" ref="editorAreaRef" @mouseenter="curScrollingArea = 'editor'"
                :style="editorAreaStyle">
            </div>
            <div class="editor-preview" ref="previewAreaRef" @scroll="onPreviewScroll"
                @mouseenter="curScrollingArea = 'preview'" :style="`${previewAreaStyle}`">
                <div id="write" class="html-area" ref="htmlAreaRef" v-html="html"></div>
            </div>
            <div class="side-bar" v-show="sideBarVisible">
                <div class="toc">
                    <div class="toc-title">目录</div>
                    <ul>
                        <li class="toc-title-item" :class="{ active: item.active }" :data-depth="item.depth"
                            v-for="(item, i) in tocData" :key="i" @click="scrollToTile(i)">
                            {{ item.content }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="footer-status">
            <span>字符数</span>
            <span>行数</span>
            <span>正文字数</span>
        </div>
    </div>
</template>

<style lang="css">
.ͼ1.cm-focused {
    outline: none !important;
}
</style>

<style lang="css" scoped>
.tools-dropdown {
    background-color: #fff;
    max-height: 300px;
    overflow: auto;

    .tools-dropdown-item {
        display: flex;
        height: 32px;
        align-items: center;
        justify-content: center;
        padding: 4px 12px;
        font-size: 14px;
        cursor: pointer;
        border-radius: 5px;

        &:hover {
            background-color: #efefef;
        }

        .tools-dropdown-item-icon {
            height: 23px;
            width: 23px;
        }

        .tools-dropdown-item-title {
            vertical-align: top;
            line-height: 25px;
        }
    }
}

.markdown-editor {
    height: 100vh;
    width: 100vw;
    position: relative;
    display: flex;
    flex-direction: column;

    .editor-header {
        display: flex;
        padding: 0 20px;
        align-items: center;
        height: 68px;

        .title-input {
            font-size: 25px;
            outline: none;
            border: none;
        }
    }

    .tools {
        display: flex;
        align-items: center;
        padding: 4px 12px;
        position: relative;
        top: 0;
        background-color: #fafbfc;
        border: solid 1px #e1e4e8;

        .tools-item {
            display: flex;
            margin: 0 6px;
            justify-content: center;
            align-items: center;
            transition: all 0.2s;
            cursor: pointer;
            text-align: center;
            font-size: 14px;
            border-radius: 4px;

            svg {
                width: 24px;
                height: 24px;
                padding: 4px;
                box-sizing: border-box;
            }

            &.active {
                color: #0366d6;
            }

            &:hover {
                background-color: #e1e4e8;
            }

        }

        .flex-grow {
            flex-grow: 1;
        }
    }

    .editor-split {
        display: flex;
        position: relative;
        height: calc(100% - 50px);
        overflow: hidden;

        #codemirror-editor-root {
            height: 100%;
            position: relative;
            overflow-y: scroll;
            overflow-x: hidden;
            outline: none;
            border: none;
            background-color: #fafbfc;
            font-size: 16px;
            resize: none;
            border-right: solid 1px #e1e4e8;
            overflow: auto;
            overflow-wrap: break-word;
        }

        .editor-preview {
            overflow-y: scroll;
            overflow-x: hidden;
            height: 100%;
            width: 800px;
            scroll-behavior: smooth;

            .html-area {
                max-width: 800px;
                word-break: break-all;
                overflow-wrap: break-word;
                padding: 0px 4%;
            }
        }


        .side-bar {
            width: 280px;
            border-left: solid 1px #e1e4e8;
            display: inline-block;
            flex-shrink: 0;
            position: relative;

            .toc {
                box-sizing: border-box;
                padding: 40px 15px;
                width: 100%;

                .toc-title {
                    font-weight: 600;
                }

                & ul {
                    padding-left: 0;
                }

                & li {
                    list-style: none;
                    cursor: pointer;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                }

                .toc-title {
                    font-size: 17px;
                    font-weight: 600;
                }

                .toc-title-item {
                    &:hover {
                        background-color: #f6f8fa;
                    }
                }

                .toc-title-item[data-depth='1'] {
                    padding-left: 5px;
                    font-weight: 550;
                }

                .toc-title-item[data-depth='2'] {
                    padding-left: 18px;
                }

                .toc-title-item[data-depth='3'] {
                    padding-left: 31px;
                }

                .toc-title-item[data-depth='4'] {
                    padding-left: 44px;
                }

                .toc-title-item.active {
                    color: #0366d6;
                    background-color: #f6f8fa;
                }
            }
        }
    }

    .footer-status {
        border: solid 1px #e1e4e8;
    }
}
</style>