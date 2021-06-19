import * as vscode from 'vscode';
import * as util from 'util';
import * as child_process from 'child_process';
import * as path from 'path';
import { PdfPreview } from './previewer';


const exec = util.promisify(child_process.exec);
let preview: PdfPreview;
let filePath: string;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('org-preview.start', () => {
			let onSaveEvent = vscode.workspace.onDidSaveTextDocument(e => {
				exportOrgToPdf();
			});
			const panel = vscode.window.createWebviewPanel(
				'org-preview',
				"Org Preview",
				vscode.ViewColumn.Beside,
				{
					enableFindWidget: false,
					retainContextWhenHidden: true
				}
			);
			panel.onDidDispose(() => {
				onSaveEvent.dispose();
			});

			filePath = vscode.window.activeTextEditor!!.document.uri.fsPath;
			const pdfUri = getPDFUri(filePath);

			exportOrgToPdf();
			preview = new PdfPreview(
				context.extensionUri,
				pdfUri,
				panel
			);
		})
	);
}


async function exportOrgToPdf() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }
	editor!!;

	const pathStr = editor.document.fileName;
	const extName = path.extname(pathStr);
	const dirPath = path.dirname(pathStr);
	const fileName = path.basename(pathStr);

	let location: vscode.ProgressLocation;
	let message: string;
	try {
		await vscode.workspace.fs.stat(preview.resource);
		location = vscode.ProgressLocation.Window;
		message = "Building...";
	} catch {
		location = vscode.ProgressLocation.Notification;
		message = "Building a new PDF ...";
	}

	if (isOrgFile(extName)) {
		let result: string;
		vscode.window.withProgress({
			location: location
		}, async (progress) => {
			progress.report({
				message: message
			});

			result = await getExportPromise(dirPath, fileName);
			if (filePath !== pathStr) {
				const resource = getPDFUri(pathStr);
				preview.loadOtherFile(resource);
				filePath = pathStr;
			} else {
				preview.reload();
			}
			parseResult(result);
		});
	}
}


function isOrgFile(ext: string): boolean {
	return ext.toLowerCase() === ".org";
}

function getPDFUri(filePath: string): vscode.Uri {
	const pdfDir = "org-mode.tmp";
	const dirname = path.dirname(filePath);
	const name = path.parse(filePath).name;
	const pdfPath = path.join(dirname, pdfDir, name + ".pdf");
	const pdfUri = vscode.Uri.file(pdfPath);

	return pdfUri;
}

function getExportPromise(dirPath: string, fileName: string): Promise<string> {
	const config = vscode.workspace.getConfiguration('org-preview');
	const useNative = config.get('useNative') as boolean;
	const cmd = useNative ?
		`emacs --batch --load="~/.emacs.d/init.el" --file=${path.join(dirPath, fileName)} --eval '(org-latex-export-to-pdf)'` :
		`docker run  --rm -v "${dirPath}":/tmp -w /tmp goodbaikin/org2pdf org2pdf "${fileName}"`;
	const promise = exec(cmd).then(({ stdout, stderr }) => {
		return stdout + "\n" + stderr;
	}).catch((reason) => {
		return reason.toString();
	});
	return promise;
}

function parseResult(result: string) {
	console.log(result);
	if (result.match(/PDF file produced./)) {
		return;
	}

	vscode.window.showErrorMessage(result);
}


export function deactivate() { }