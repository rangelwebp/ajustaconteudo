"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Copy,
	Check,
	History,
	Download,
	Upload,
	Trash2,
	Sparkles,
	Minimize2,
	Maximize2,
	ExternalLink,
	X,
	Loader2,
} from "lucide-react";
import { Toaster, toast } from "sonner";

interface FormattedContent {
	titulo: string;
	subtitulo: string;
	corpo: string;
	fonte: string;
	versaoX: string;
}

interface HistoryItem extends FormattedContent {
	id: string;
	createdAt: string;
}

export default function Home() {
	const [formData, setFormData] = useState({
		titulo: "",
		subtitulo: "",
		corpo: "",
		fonte: "",
	});

	const [formatted, setFormatted] = useState<FormattedContent | null>(null);
	const [loading, setLoading] = useState(false);

	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [showHistory, setShowHistory] = useState(false);
	const [showImportExport, setShowImportExport] = useState(false);
	const [isFloating, setIsFloating] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);

	const [copiedField, setCopiedField] = useState<string | null>(null);

	useEffect(() => {
		const saved = localStorage.getItem("ajustaHistorico");
		if (saved) {
			try {
				setHistory(JSON.parse(saved));
			} catch (e) {
				console.error("Erro ao carregar histórico:", e);
			}
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("ajustaHistorico", JSON.stringify(history));
	}, [history]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.titulo.trim() || !formData.corpo.trim()) {
			toast.error("Título e Corpo são obrigatórios!");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/format", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao formatar texto");
			}

			const data = await response.json();
			setFormatted(data);

			const historyItem: HistoryItem = {
				...data,
				id: Date.now().toString(),
				createdAt: new Date().toISOString(),
			};

			setHistory((prev) => [historyItem, ...prev].slice(0, 60));

			toast.success("Texto formatado com sucesso!");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Erro desconhecido",
			);
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = async (
		text: string,
		fieldName: string,
		fieldKey: string,
	) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldKey);
			toast.success(`${fieldName} copiado!`);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			toast.error(`Erro ao copiar ${fieldName}`);
		}
	};

	const exportHistory = () => {
		if (history.length === 0) {
			toast.warning("Histórico vazio!");
			return;
		}
		const dataStr = JSON.stringify(history, null, 2);
		const blob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `ajusta-historico-${new Date().toISOString().split("T")[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
		toast.success("Histórico exportado!");
	};

	const importHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const imported = JSON.parse(event.target?.result as string);
				if (Array.isArray(imported)) {
					const merged = [...imported, ...history]
						.sort(
							(a, b) =>
								new Date(b.createdAt).getTime() -
								new Date(a.createdAt).getTime(),
						)
						.slice(0, 60);
					setHistory(merged);
					toast.success(`${imported.length} itens importados!`);
					setShowImportExport(false);
				} else {
					toast.error("Formato inválido!");
				}
			} catch (err) {
				toast.error("Erro ao ler arquivo!");
			}
		};
		reader.readAsText(file);
	};

	const clearHistory = () => {
		if (history.length === 0) {
			toast.warning("Histórico já está vazio!");
			return;
		}
		toast("Tem certeza?", {
			description: "Isso apagará todo o histórico permanentemente.",
			action: {
				label: "Apagar",
				onClick: () => {
					setHistory([]);
					localStorage.removeItem("ajustaHistorico");
					toast.success("Histórico limpo!");
				},
			},
			cancel: { label: "Cancelar", onClick: () => {} },
		});
	};

	const loadFromHistory = (item: HistoryItem) => {
		setFormData({
			titulo: item.titulo,
			subtitulo: item.subtitulo,
			corpo: item.corpo,
			fonte: item.fonte,
		});
		setFormatted({
			titulo: item.titulo,
			subtitulo: item.subtitulo,
			corpo: item.corpo,
			fonte: item.fonte,
			versaoX: item.versaoX,
		});
		setShowHistory(false);
		toast.success("Item carregado!");
	};

	const deleteFromHistory = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setHistory((prev) => prev.filter((item) => item.id !== id));
		toast.success("Item removido!");
	};

	const formatDate = (isoString: string) =>
		new Date(isoString).toLocaleString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});

	const openPopup = () => {
		const width = 450;
		const height = 700;
		const left = window.screen.width - width - 20;
		const top = 100;

		const popup = window.open(
			"/popup",
			"AjustaPopup",
			`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
		);

		if (popup) popup.focus();
		else toast.error("Permita popups para este site!");
	};

	return (
		<>
			<Toaster position="top-right" richColors theme="dark" />

			<motion.button
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				onClick={() => setIsFloating(!isFloating)}
				className="fixed bottom-6 right-6 z-50 bg-[#C99A3C] hover:bg-[#DCB158] text-[#17140F] p-3.5 rounded-full shadow-lg shadow-black/40 transition-colors">
				{isFloating ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
			</motion.button>

			{isFloating && (
				<motion.div
					initial={{ opacity: 0, y: 100, scale: 0.9 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 100, scale: 0.9 }}
					className="fixed bottom-24 right-6 z-40 w-[400px] max-h-[80vh] overflow-y-auto">
					<FloatingPanel
						formData={formData}
						formatted={formatted}
						loading={loading}
						isMinimized={isMinimized}
						onToggleMinimize={() => setIsMinimized(!isMinimized)}
						onToggleHistory={() => setShowHistory(!showHistory)}
						onToggleImportExport={() =>
							setShowImportExport(!showImportExport)
						}
						onClose={() => setIsFloating(false)}
						onSubmit={handleSubmit}
						onChange={handleChange}
						onCopy={copyToClipboard}
						copiedField={copiedField}
						history={history}
						showHistory={showHistory}
						showImportExport={showImportExport}
						exportHistory={exportHistory}
						importHistory={importHistory}
						clearHistory={clearHistory}
						loadFromHistory={loadFromHistory}
						deleteFromHistory={deleteFromHistory}
						formatDate={formatDate}
					/>
				</motion.div>
			)}

			{!isFloating && (
				<main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
					<div className="max-w-4xl mx-auto">
						<div className="flex justify-between items-center mb-8">
							<motion.h1
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
								AjustaConteúdo
							</motion.h1>
							<div className="flex gap-2">
								<button
									onClick={() =>
										setShowImportExport(!showImportExport)
									}
									className="text-sm bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-all hover:border-blue-500/50 backdrop-blur-sm">
									💾 Exportar/Importar
								</button>
								<button
									onClick={() => setShowHistory(!showHistory)}
									className="text-sm bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-all hover:border-purple-500/50 backdrop-blur-sm">
									📜 Histórico ({history.length})
								</button>
								<button
									onClick={openPopup}
									className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg flex items-center gap-2">
									<ExternalLink size={16} />
									Abrir Popup
								</button>
							</div>
						</div>

						{showImportExport && (
							<ImportExportPanel
								history={history}
								exportHistory={exportHistory}
								importHistory={importHistory}
								clearHistory={clearHistory}
								onClose={() => setShowImportExport(false)}
							/>
						)}

						{showHistory && (
							<HistoryPanel
								history={history}
								loadFromHistory={loadFromHistory}
								deleteFromHistory={deleteFromHistory}
								formatDate={formatDate}
								onClose={() => setShowHistory(false)}
							/>
						)}

						<FormPanel
							formData={formData}
							formatted={formatted}
							loading={loading}
							copiedField={copiedField}
							onSubmit={handleSubmit}
							onChange={handleChange}
							onCopy={copyToClipboard}
						/>
					</div>
				</main>
			)}
		</>
	);
}

function FloatingPanel({ ...props }: any) {
	return (
		<div className="bg-gray-900/95 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
			<div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
				<h2 className="font-semibold text-white">AjustaConteúdo</h2>
				<div className="flex gap-2">
					<button
						onClick={props.onToggleMinimize}
						className="text-gray-400 hover:text-white transition-colors">
						{props.isMinimized ? (
							<Maximize2 size={18} />
						) : (
							<Minimize2 size={18} />
						)}
					</button>
					<button
						onClick={props.onClose}
						className="text-gray-400 hover:text-red-400 transition-colors">
						<X size={18} />
					</button>
				</div>
			</div>

			{!props.isMinimized && (
				<div className="p-4 space-y-4">
					<form onSubmit={props.onSubmit} className="space-y-3">
						<InputField
							label="Título *"
							name="titulo"
							value={props.formData.titulo}
							onChange={props.onChange}
							placeholder="Digite o título"
						/>
						<InputField
							label="Subtítulo"
							name="subtitulo"
							value={props.formData.subtitulo}
							onChange={props.onChange}
							placeholder="Digite o subtítulo"
						/>
						<TextAreaField
							label="Corpo *"
							name="corpo"
							value={props.formData.corpo}
							onChange={props.onChange}
							placeholder="Digite o corpo do texto"
							rows={4}
						/>
						<InputField
							label="Fonte"
							name="fonte"
							value={props.formData.fonte}
							onChange={props.onChange}
							placeholder="Ex: Instagram @usuario"
						/>
						<button
							type="submit"
							disabled={props.loading}
							className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
							{props.loading ? (
								<>
									<Loader2
										className="animate-spin"
										size={18}
									/>
									Formatando...
								</>
							) : (
								<>
									<Sparkles size={18} />
									Formatar
								</>
							)}
						</button>
					</form>

					{props.formatted && (
						<div className="space-y-3 pt-3 border-t border-gray-700">
							<ResultField
								label="Título"
								value={props.formatted.titulo}
								onCopy={() =>
									props.onCopy(
										props.formatted.titulo,
										"Título",
										"titulo",
									)
								}
								isCopied={props.copiedField === "titulo"}
							/>
							{props.formatted.subtitulo && (
								<ResultField
									label="Subtítulo"
									value={props.formatted.subtitulo}
									onCopy={() =>
										props.onCopy(
											props.formatted.subtitulo,
											"Subtítulo",
											"subtitulo",
										)
									}
									isCopied={props.copiedField === "subtitulo"}
								/>
							)}
							<ResultField
								label="Corpo"
								value={props.formatted.corpo}
								onCopy={() =>
									props.onCopy(
										props.formatted.corpo,
										"Corpo",
										"corpo",
									)
								}
								isCopied={props.copiedField === "corpo"}
								multiline
							/>
							{props.formatted.fonte && (
								<ResultField
									label="Fonte"
									value={props.formatted.fonte}
									onCopy={() =>
										props.onCopy(
											props.formatted.fonte,
											"Fonte",
											"fonte",
										)
									}
									isCopied={props.copiedField === "fonte"}
								/>
							)}
							<ResultField
								label="Versão X"
								value={props.formatted.versaoX}
								onCopy={() =>
									props.onCopy(
										props.formatted.versaoX,
										"Versão X",
										"versaoX",
									)
								}
								isCopied={props.copiedField === "versaoX"}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function FormPanel({
	formData,
	formatted,
	loading,
	copiedField,
	onSubmit,
	onChange,
	onCopy,
}: any) {
	return (
		<motion.form
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			onSubmit={onSubmit}
			className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 backdrop-blur-sm">
			<div className="space-y-4">
				<InputField
					label="Título *"
					name="titulo"
					value={formData.titulo}
					onChange={onChange}
					placeholder="Digite o título"
				/>
				<InputField
					label="Subtítulo"
					name="subtitulo"
					value={formData.subtitulo}
					onChange={onChange}
					placeholder="Digite o subtítulo"
				/>
				<TextAreaField
					label="Corpo *"
					name="corpo"
					value={formData.corpo}
					onChange={onChange}
					placeholder="Digite o corpo do texto"
					rows={6}
				/>
				<InputField
					label="Fonte"
					name="fonte"
					value={formData.fonte}
					onChange={onChange}
					placeholder="Ex: Instagram @usuario"
				/>
				<button
					type="submit"
					disabled={loading}
					className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
					{loading ? (
						<>
							<Loader2 className="animate-spin" size={20} />
							Formatando...
						</>
					) : (
						<>
							<Sparkles size={20} />
							Formatar Conteúdo
						</>
					)}
				</button>
			</div>
		</motion.form>
	);
}

function InputField({ label, name, value, onChange, placeholder }: any) {
	return (
		<div>
			<label className="block text-sm font-medium text-gray-300 mb-1.5">
				{label}
			</label>
			<input
				type="text"
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
			/>
		</div>
	);
}

function TextAreaField({
	label,
	name,
	value,
	onChange,
	placeholder,
	rows,
}: any) {
	return (
		<div>
			<label className="block text-sm font-medium text-gray-300 mb-1.5">
				{label}
			</label>
			<textarea
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				rows={rows}
				className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
			/>
		</div>
	);
}

function ResultField({ label, value, onCopy, isCopied, multiline }: any) {
	return (
		<div>
			<div className="flex justify-between items-center mb-2">
				<label className="text-sm font-medium text-gray-300">
					{label}
				</label>
				<button
					onClick={onCopy}
					className={`text-sm px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
						isCopied
							? "bg-green-600 text-white"
							: "bg-gray-700 hover:bg-gray-600 text-gray-200"
					}`}>
					{isCopied ? (
						<>
							<Check size={14} />
							Copiado
						</>
					) : (
						<>
							<Copy size={14} />
							Copiar
						</>
					)}
				</button>
			</div>
			<p
				className={`text-gray-100 p-4 bg-gray-900/50 rounded-lg border border-gray-700 ${multiline ? "whitespace-pre-wrap" : ""}`}>
				{value}
			</p>
		</div>
	);
}

function ImportExportPanel({
	history,
	exportHistory,
	importHistory,
	clearHistory,
	onClose,
}: any) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-6 backdrop-blur-sm">
			<div className="flex flex-wrap gap-3 items-center">
				<button
					onClick={exportHistory}
					disabled={history.length === 0}
					className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2">
					<Download size={18} />
					Exportar
				</button>
				<label className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-lg flex items-center gap-2">
					<Upload size={18} />
					Importar
					<input
						type="file"
						accept=".json"
						onChange={importHistory}
						className="hidden"
					/>
				</label>
				<button
					onClick={clearHistory}
					disabled={history.length === 0}
					className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2">
					<Trash2 size={18} />
					Limpar
				</button>
				<button
					onClick={onClose}
					className="text-gray-400 hover:text-white px-3 py-2 transition-colors">
					<X size={18} />
				</button>
			</div>
			<p className="text-sm text-gray-400 mt-3">
				{history.length} {history.length === 1 ? "item" : "itens"} no
				histórico
			</p>
		</motion.div>
	);
}

function HistoryPanel({
	history,
	loadFromHistory,
	deleteFromHistory,
	formatDate,
	onClose,
}: any) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-6 backdrop-blur-sm">
			<h2 className="text-lg font-semibold text-white mb-4">
				Histórico ({history.length}{" "}
				{history.length === 1 ? "item" : "itens"})
			</h2>
			<div className="max-h-96 overflow-y-auto space-y-2 pr-2">
				{history.length === 0 ? (
					<p className="text-gray-500 text-center py-6">
						Nenhum item no histórico
					</p>
				) : (
					history.map((item: HistoryItem) => (
						<div
							key={item.id}
							onClick={() => loadFromHistory(item)}
							className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer group">
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<p className="font-medium text-gray-200 truncate group-hover:text-purple-300 transition-colors">
										{item.titulo}
									</p>
									<p className="text-xs text-gray-500 mt-1">
										{formatDate(item.createdAt)}
									</p>
								</div>
								<button
									onClick={(e) =>
										deleteFromHistory(item.id, e)
									}
									className="text-red-500 hover:text-red-400 ml-3 p-1 hover:bg-red-500/10 rounded transition-all">
									<Trash2 size={16} />
								</button>
							</div>
						</div>
					))
				)}
			</div>
			<button
				onClick={onClose}
				className="mt-4 text-gray-400 hover:text-white px-3 py-2 transition-colors">
				<X size={18} />
			</button>
		</motion.div>
	);
}
