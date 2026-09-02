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

// Cada campo carrega uma cor própria — não é decoração, é identidade
// estrutural: a mesma cor aparece no rótulo do input e no resultado.
const FIELD_COLOR = {
	titulo: "#C99A3C", // âmbar
	subtitulo: "#8FA6C7", // azul empoeirado
	corpo: "#B9AF98", // ink neutro
	fonte: "#7A9B7E", // sálvia
	versaoX: "#BE6A4E", // terracota
} as const;

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
			`${window.location.origin}/popup`,
			"AjustaPopup",
			`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
		);

		if (popup) popup.focus();
		else toast.error("Permita popups para este site!");
	};

	return (
		<>
			<Toaster
				position="top-right"
				richColors
				theme="dark"
				toastOptions={{
					style: {
						background: "#1F1B14",
						border: "1px solid #35301F",
						color: "#EDE6D6",
					},
				}}
			/>

			<button
				onClick={() => setIsFloating(!isFloating)}
				aria-label={
					isFloating ? "Minimizar painel" : "Abrir painel flutuante"
				}
				className="fixed bottom-6 right-6 z-50 bg-[#C99A3C] hover:bg-[#DCB158] text-[#17140F] p-3.5 rounded-full shadow-lg shadow-black/40 transition-colors">
				{isFloating ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
			</button>

			<AnimatePresence>
				{isFloating && (
					<motion.div
						initial={{ opacity: 0, y: 24, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 24, scale: 0.97 }}
						transition={{ duration: 0.18 }}
						className="fixed bottom-24 right-6 z-40 w-[400px] max-h-[80vh] overflow-y-auto">
						<FloatingPanel
							formData={formData}
							formatted={formatted}
							loading={loading}
							isMinimized={isMinimized}
							onSubmit={handleSubmit}
							onChange={handleChange}
							onCopy={copyToClipboard}
							onToggleMinimize={() =>
								setIsMinimized(!isMinimized)
							}
							onClose={() => setIsFloating(false)}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{!isFloating && (
				<main className="min-h-screen bg-[#17140F] py-14 px-5">
					<div className="max-w-2xl mx-auto">
						{/* Header */}
						<header className="mb-10">
							<h1 className="font-serif text-3xl text-[#EDE6D6] tracking-tight">
								AjustaConteúdo
							</h1>
							<p className="mt-1.5 text-sm text-[#9C917A]">
								Prepare um texto para publicação em diferentes
								formatos.
							</p>

							<div className="mt-6 flex flex-wrap gap-1 border-t border-[#35301F] pt-4">
								<ToolbarButton
									icon={<Download size={15} />}
									label="Exportar/Importar"
									active={showImportExport}
									onClick={() =>
										setShowImportExport(!showImportExport)
									}
								/>
								<ToolbarButton
									icon={<History size={15} />}
									label={`Histórico (${history.length})`}
									active={showHistory}
									onClick={() => setShowHistory(!showHistory)}
								/>
								<button
									type="button"
									onClick={openPopup}
									className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg flex items-center gap-2">
									<ExternalLink size={16} />
									Abrir Popup
								</button>
							</div>
						</header>

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

// ---------- Componentes ----------

function ToolbarButton({ icon, label, onClick, active }: any) {
	return (
		<button
			onClick={onClick}
			className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md transition-colors ${
				active
					? "bg-[#262019] text-[#EDE6D6]"
					: "text-[#9C917A] hover:text-[#EDE6D6] hover:bg-[#1F1B14]"
			}`}>
			{icon}
			{label}
		</button>
	);
}

function FloatingPanel({
	formData,
	formatted,
	loading,
	isMinimized,
	onSubmit,
	onChange,
	onCopy,
	onToggleMinimize,
	onClose,
}: any) {
	return (
		<div className="bg-[#1B1712] border border-[#35301F] rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
			<div className="px-4 py-3 border-b border-[#35301F] flex justify-between items-center">
				<span className="font-serif text-[#EDE6D6]">
					AjustaConteúdo
				</span>
				<div className="flex gap-1">
					<button
						onClick={onToggleMinimize}
						className="text-[#9C917A] hover:text-[#EDE6D6] p-1 transition-colors">
						{isMinimized ? (
							<Maximize2 size={16} />
						) : (
							<Minimize2 size={16} />
						)}
					</button>
					<button
						onClick={onClose}
						className="text-[#9C917A] hover:text-[#BE6A4E] p-1 transition-colors">
						<X size={16} />
					</button>
				</div>
			</div>

			{!isMinimized && (
				<div className="p-4 space-y-4">
					<form onSubmit={onSubmit} className="space-y-3">
						<InputField
							label="Título"
							required
							name="titulo"
							value={formData.titulo}
							onChange={onChange}
							placeholder="Digite o título"
							dot={FIELD_COLOR.titulo}
						/>
						<InputField
							label="Subtítulo"
							name="subtitulo"
							value={formData.subtitulo}
							onChange={onChange}
							placeholder="Digite o subtítulo"
							dot={FIELD_COLOR.subtitulo}
						/>
						<TextAreaField
							label="Corpo"
							required
							name="corpo"
							value={formData.corpo}
							onChange={onChange}
							placeholder="Digite o corpo do texto"
							rows={4}
							dot={FIELD_COLOR.corpo}
						/>
						<InputField
							label="Fonte"
							name="fonte"
							value={formData.fonte}
							onChange={onChange}
							placeholder="Ex: Instagram @usuario"
							dot={FIELD_COLOR.fonte}
						/>
						<SubmitButton loading={loading} />
					</form>

					{formatted && (
						<div className="pt-3 border-t border-[#35301F]">
							<ResultSheet
								formatted={formatted}
								onCopy={onCopy}
								copiedField={undefined}
								compact
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
		<div className="space-y-8">
			<form
				onSubmit={onSubmit}
				className="bg-[#1B1712] border border-[#35301F] rounded-xl p-6">
				<div className="space-y-4">
					<InputField
						label="Título"
						required
						name="titulo"
						value={formData.titulo}
						onChange={onChange}
						placeholder="Digite o título"
						dot={FIELD_COLOR.titulo}
					/>
					<InputField
						label="Subtítulo"
						name="subtitulo"
						value={formData.subtitulo}
						onChange={onChange}
						placeholder="Digite o subtítulo"
						dot={FIELD_COLOR.subtitulo}
					/>
					<TextAreaField
						label="Corpo"
						required
						name="corpo"
						value={formData.corpo}
						onChange={onChange}
						placeholder="Digite o corpo do texto"
						rows={6}
						dot={FIELD_COLOR.corpo}
					/>
					<InputField
						label="Fonte"
						name="fonte"
						value={formData.fonte}
						onChange={onChange}
						placeholder="Ex: Instagram @usuario"
						dot={FIELD_COLOR.fonte}
					/>
					<SubmitButton loading={loading} />
				</div>
			</form>

			{formatted && (
				<div>
					<p className="text-sm text-[#9C917A] mb-3">Resultado</p>
					<ResultSheet
						formatted={formatted}
						onCopy={onCopy}
						copiedField={copiedField}
					/>
				</div>
			)}
		</div>
	);
}

function SubmitButton({ loading }: { loading: boolean }) {
	return (
		<button
			type="submit"
			disabled={loading}
			className="w-full bg-[#C99A3C] hover:bg-[#DCB158] disabled:opacity-50 disabled:cursor-not-allowed text-[#17140F] font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
			{loading ? (
				<>
					<Loader2 className="animate-spin" size={18} />
					Formatando...
				</>
			) : (
				<>
					<Sparkles size={18} />
					Formatar
				</>
			)}
		</button>
	);
}

function InputField({
	label,
	name,
	value,
	onChange,
	placeholder,
	dot,
	required,
}: any) {
	return (
		<div>
			<label className="flex items-center gap-2 text-sm text-[#9C917A] mb-1.5">
				<span
					className="w-1.5 h-1.5 rounded-full shrink-0"
					style={{ backgroundColor: dot }}
				/>
				{label}
				{required && <span className="text-[#BE6A4E]">*</span>}
			</label>
			<input
				type="text"
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				className="w-full px-3.5 py-2.5 bg-[#17140F] border border-[#35301F] rounded-lg text-[#EDE6D6] placeholder-[#6B6350] focus:outline-none focus:border-[#C99A3C]/60 focus:ring-1 focus:ring-[#C99A3C]/40 transition-colors"
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
	dot,
	required,
}: any) {
	return (
		<div>
			<label className="flex items-center gap-2 text-sm text-[#9C917A] mb-1.5">
				<span
					className="w-1.5 h-1.5 rounded-full shrink-0"
					style={{ backgroundColor: dot }}
				/>
				{label}
				{required && <span className="text-[#BE6A4E]">*</span>}
			</label>
			<textarea
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				rows={rows}
				className="w-full px-3.5 py-2.5 bg-[#17140F] border border-[#35301F] rounded-lg text-[#EDE6D6] placeholder-[#6B6350] focus:outline-none focus:border-[#C99A3C]/60 focus:ring-1 focus:ring-[#C99A3C]/40 transition-colors resize-y"
			/>
		</div>
	);
}

function ResultSheet({ formatted, onCopy, copiedField, compact }: any) {
	const rows = [
		{
			key: "titulo",
			label: "Título",
			value: formatted.titulo,
			serif: true,
		},
		{
			key: "subtitulo",
			label: "Subtítulo",
			value: formatted.subtitulo,
			serif: true,
		},
		{
			key: "corpo",
			label: "Corpo",
			value: formatted.corpo,
			multiline: true,
		},
		{ key: "fonte", label: "Fonte", value: formatted.fonte },
		{
			key: "versaoX",
			label: "Versão X",
			value: formatted.versaoX,
			counter: true,
		},
	].filter((r) => r.value);

	return (
		<div
			className={
				compact
					? "space-y-3"
					: "bg-[#1B1712] border border-[#35301F] rounded-xl divide-y divide-[#2A251C]"
			}>
			{rows.map((row) => (
				<div key={row.key} className={compact ? "" : "px-5 py-4"}>
					<div className="flex justify-between items-center mb-1.5">
						<span className="flex items-center gap-2 text-xs text-[#9C917A]">
							<span
								className="w-1.5 h-1.5 rounded-full shrink-0"
								style={{
									backgroundColor: (FIELD_COLOR as any)[
										row.key
									],
								}}
							/>
							{row.label}
							{row.counter && (
								<span className="tabular-nums text-[#6B6350]">
									· {row.value.length} caract.
								</span>
							)}
						</span>
						<button
							onClick={() =>
								onCopy(row.value, row.label, row.key)
							}
							className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
								copiedField === row.key
									? "bg-[#7A9B7E]/20 text-[#7A9B7E]"
									: "text-[#9C917A] hover:text-[#EDE6D6] hover:bg-[#262019]"
							}`}>
							{copiedField === row.key ? (
								<Check size={13} />
							) : (
								<Copy size={13} />
							)}
							{copiedField === row.key ? "Copiado" : "Copiar"}
						</button>
					</div>
					<p
						className={`text-[#EDE6D6] ${row.serif ? "font-serif text-lg" : "text-sm"} ${
							row.multiline
								? "whitespace-pre-wrap leading-relaxed"
								: ""
						}`}>
						{row.value}
					</p>
				</div>
			))}
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
		<div className="bg-[#1B1712] border border-[#35301F] rounded-xl p-5 mb-6">
			<div className="flex flex-wrap gap-2 items-center">
				<button
					onClick={exportHistory}
					disabled={history.length === 0}
					className="inline-flex items-center gap-2 text-sm bg-[#262019] hover:bg-[#2A251C] disabled:opacity-40 disabled:cursor-not-allowed text-[#EDE6D6] px-4 py-2 rounded-lg transition-colors">
					<Download size={15} />
					Exportar
				</button>
				<label className="inline-flex items-center gap-2 text-sm bg-[#262019] hover:bg-[#2A251C] text-[#EDE6D6] px-4 py-2 rounded-lg transition-colors cursor-pointer">
					<Upload size={15} />
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
					className="inline-flex items-center gap-2 text-sm text-[#BE6A4E] hover:bg-[#BE6A4E]/10 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors">
					<Trash2 size={15} />
					Limpar
				</button>
				<button
					onClick={onClose}
					className="ml-auto text-[#9C917A] hover:text-[#EDE6D6] p-2 transition-colors">
					<X size={16} />
				</button>
			</div>
			<p className="text-sm text-[#6B6350] mt-3">
				{history.length} {history.length === 1 ? "item" : "itens"} no
				histórico
			</p>
		</div>
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
		<div className="bg-[#1B1712] border border-[#35301F] rounded-xl p-5 mb-6">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-[#EDE6D6]">
					Histórico ({history.length}{" "}
					{history.length === 1 ? "item" : "itens"})
				</h2>
				<button
					onClick={onClose}
					className="text-[#9C917A] hover:text-[#EDE6D6] p-1 transition-colors">
					<X size={16} />
				</button>
			</div>
			<div className="max-h-96 overflow-y-auto -mx-2">
				{history.length === 0 ? (
					<p className="text-[#6B6350] text-center py-6 text-sm">
						Nenhum item no histórico
					</p>
				) : (
					history.map((item: HistoryItem) => (
						<div
							key={item.id}
							onClick={() => loadFromHistory(item)}
							className="flex justify-between items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[#262019] transition-colors cursor-pointer group">
							<div className="min-w-0">
								<p className="text-sm text-[#EDE6D6] truncate">
									{item.titulo}
								</p>
								<p className="text-xs text-[#6B6350] mt-0.5">
									{formatDate(item.createdAt)}
								</p>
							</div>
							<button
								onClick={(e) => deleteFromHistory(item.id, e)}
								className="text-[#6B6350] hover:text-[#BE6A4E] p-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
								<Trash2 size={15} />
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
