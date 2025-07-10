// src/ckeditor.ts
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor.js';

import Essentials               from '@ckeditor/ckeditor5-essentials/src/essentials.js';
import Bold                     from '@ckeditor/ckeditor5-basic-styles/src/bold.js';
import Italic                   from '@ckeditor/ckeditor5-basic-styles/src/italic.js';
import Underline                from '@ckeditor/ckeditor5-basic-styles/src/underline.js';
import Strikethrough            from '@ckeditor/ckeditor5-basic-styles/src/strikethrough.js';

import Heading                  from '@ckeditor/ckeditor5-heading/src/heading.js';
import Paragraph                from '@ckeditor/ckeditor5-paragraph/src/paragraph.js';
import Link                     from '@ckeditor/ckeditor5-link/src/link.js';
import List                     from '@ckeditor/ckeditor5-list/src/list.js';
import Alignment                from '@ckeditor/ckeditor5-alignment/src/alignment.js';

import BlockQuote               from '@ckeditor/ckeditor5-block-quote/src/blockquote.js';
import CodeBlock                from '@ckeditor/ckeditor5-code-block/src/codeblock.js';

import Table                    from '@ckeditor/ckeditor5-table/src/table.js';
import TableToolbar             from '@ckeditor/ckeditor5-table/src/tabletoolbar.js';

import Image                    from '@ckeditor/ckeditor5-image/src/image.js';
import ImageToolbar             from '@ckeditor/ckeditor5-image/src/imagetoolbar.js';
import ImageCaption             from '@ckeditor/ckeditor5-image/src/imagecaption.js';
import ImageStyle               from '@ckeditor/ckeditor5-image/src/imagestyle.js';
import ImageUpload              from '@ckeditor/ckeditor5-image/src/imageupload.js';

import Base64UploadAdapter      from '@ckeditor/ckeditor5-upload/src/adapters/base64uploadadapter.js';

export default class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.builtinPlugins = [
  Essentials,
  Bold, Italic, Underline, Strikethrough,
  Heading, Paragraph,
  Link, List, Alignment,
  BlockQuote, CodeBlock,
  Table, TableToolbar,
  Image, ImageToolbar, ImageCaption, ImageStyle, ImageUpload,
  Base64UploadAdapter
];

ClassicEditor.defaultConfig = {
  toolbar: {
    items: [
      'heading', '|',
      'bold','italic','underline','strikethrough','|',
      'numberedList','bulletedList','|',
      'alignment','|',
      'blockQuote','codeBlock','|',
      'insertTable','|',
      'uploadImage','link','undo','redo'
    ]
  },
  table: {
    contentToolbar: [ 'tableColumn','tableRow','mergeTableCells' ]
  },
  image: {
    toolbar: [ 'imageTextAlternative','imageStyle:full','imageStyle:side' ]
  },
  language: 'en'
};
