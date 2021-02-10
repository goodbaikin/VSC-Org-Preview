import * as vscode from 'vscode';
import * as util from 'util';
import * as child_process from 'child_process';

const exec = util.promisify(child_process.exec);

let panel: vscode.WebviewPanel;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('org-preview.start', () => {
			panel = vscode.window.createWebviewPanel(
				'Org Preview',
				'Org Preview',
				vscode.ViewColumn.Beside,
				{}
			);
			updateWebView();
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(e => {
			updateWebView();
		})
	);
}

async function updateWebView() {
	let editor = vscode.window.activeTextEditor;
	if (!editor) { return; }
	editor!!;

	let path = editor.document.fileName;
	let index = path.lastIndexOf('/');
	let fileName = path.slice(index + 1, undefined);
	let dirPath = path.slice(undefined, index);
	if (isOrgFile(fileName)) {
		let stderr = await getConvertPromise(dirPath, fileName);
		console.log(stderr);
	}

}


function isOrgFile(fileName: string) {
	let index = fileName.lastIndexOf('.') + 1;
	let ext = fileName.slice(index);
	return ext.toLocaleLowerCase() === "org";
}

function getConvertPromise(dirPath: string, fileName: string) {
	let cmd = `docker run --rm -v "${dirPath}":/tmp -w /tmp goodbaikin/org2pdf org2pdf "${fileName}"`;
	let promise = exec(cmd).then(({ stdout, stderr }) => {
		return stderr;
	});
	return promise;
}