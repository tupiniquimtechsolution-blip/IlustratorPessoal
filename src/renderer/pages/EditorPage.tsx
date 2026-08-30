import { AssetPanel } from '../editor/AssetPanel';
import { EditorCanvas } from '../editor/EditorCanvas';
import { EditorTopbar } from '../editor/EditorTopbar';
import { PromptPanel } from '../editor/PromptPanel';
import { ToolRail } from '../editor/ToolRail';

export function EditorPage() { return <div className="editor-page"><EditorTopbar /><div className="editor-body"><ToolRail /><AssetPanel /><EditorCanvas /><PromptPanel /></div></div>; }
