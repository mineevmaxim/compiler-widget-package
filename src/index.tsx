export { default as CompilerWidget } from './components/CompilerWidget';
export { FileExplorer } from './components/FileExplorer';
export { MonacoEditorWrapper } from './components/MonacoEditorWrapper';
export { OutputPanel } from './components/OutputPanel';
export { RunContainer } from './components/RunContainer';

export { useCompiler } from './hooks/useCompiler';

export { FileApi, CompilerApi, Configuration } from './api';

export type { EditorDocument } from './types/EditorDocument';
export { type GetInfoModel, getInfo, getWidgetInfo, updateInfo } from './getInfo';

import CompilerWidget from './components/CompilerWidget';
import { Handle, Position } from '@xyflow/react';

import './index.scss';

export const CompilerWidgetNode = (props: any) => (
  <>
    <Handle type="target" position={Position.Top} />
    <CompilerWidget {...props} />
    <Handle type="source" position={Position.Bottom} />
  </>
);