import * as vscode from 'vscode';
import * as util from 'util';
import * as child_process from 'child_process';
import * as path from 'path';
import { PdfPreview } from './previewer';


const exec = util.promisify(child_process.exec);

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('org-preview.start', () => {
			const panel = vscode.window.createWebviewPanel(
				'org-preview',
				"Org Preview",
				vscode.ViewColumn.Beside,
				{
					enableFindWidget: false,
					retainContextWhenHidden: true
				}
			);
			let filePath = vscode.window.activeTextEditor!!.document.uri.fsPath;
			let dirname = path.dirname(filePath);
			let name = path.parse(filePath).name;
			let pdfPath = path.join(dirname, name + ".pdf");
			let pdfUri = vscode.Uri.file(pdfPath);

			exportOrgToPdf();
			const preview = new PdfPreview(
				context.extensionUri,
				pdfUri,
				panel
			);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(e => {
			exportOrgToPdf();
		})
	);
}


async function exportOrgToPdf() {
	let editor = vscode.window.activeTextEditor;
	if (!editor) { return; }
	editor!!;

	let pathStr = editor.document.fileName;
	let extName = path.extname(pathStr);
	let dirPath = path.dirname(pathStr);
	let fileName = path.basename(pathStr);
	if (isOrgFile(extName)) {
		let result = await getExportPromise(dirPath, fileName);
		console.log(result);
	}
}


function isOrgFile(ext: string) {
	return ext.toLowerCase() === ".org";
}

function getExportPromise(dirPath: string, fileName: string) {
	let cmd = `docker run --rm -v "${dirPath}":/tmp -w /tmp goodbaikin/org2pdf org2pdf "${fileName}"`;
	let promise = exec(cmd).then(({ stdout, stderr }) => {
		return stdout + "\n" + stderr;
	});
	return promise;
}



export function deactivate() { }