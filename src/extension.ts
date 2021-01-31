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
	let text = getEditorText();
	if (text != "") {
		panel.webview.html = await getConvertPromise(text);
	}
}

function getEditorText() {
	// if editor is null
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return "";
	}

	// check file extension
	let fileName = editor!!.document.fileName;
	let ext = fileName.slice(fileName.lastIndexOf('.') + 1);
	if (ext.toLowerCase() == "org") {
		return editor.document.getText();
	}

	return "";
}

function getConvertPromise(orgStr: string) {
	let emacs_cmd = `echo "${orgStr}"|emacs --batch -l /root/.emacs.d/init.el -f org-stdin-to-html-full`;
	let cmd = 'docker run --rm -v $(pwd):/tmp -w /tmp goodbaikin/org2pdf bash -c \'' + emacs_cmd + '\'';
	let promise = exec(cmd).then(({ stdout, stderr }) => {
		return stdout;
	});

	return promise;
}