// app/popup/page.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Sparkles,
	Copy,
	Check,
	Loader2,
	Type,
	FileText,
	Image,
	X,
} from "lucide-react";
import { Toaster, toast } from "sonner";

interface FormattedContent {
	titulo: string;
	subtitulo: string;
	corpo: string;
	fonte: string;
	versaoX: string;
}

export default function PopupPage() {
	const [formData, setFormData] = useState({
		titulo: "",
		subtitulo: "",
		corpo: "",
		fonte: "",
	});

	const [formatted, setFormatted] = useState<FormattedContent | null>(null);
	const [loading, setLoading] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

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
			toast.success("Texto formatado!");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro");
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
			toast.error(`Erro ao copiar`);
		}
	};

	return (
		<>
			<Toaster position="top-center" richColors theme="dark" />

			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
				<div className="max-w-lg mx-auto">
					{/* Header */}
					<div className="flex justify-between items-center mb-6">
						<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
							AjustaConteúdo
						</h1>
					</div>

					{/* Formulário */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
								<Type size={16} />
								Título *
							</label>
							<input
								type="text"
								name="titulo"
								value={formData.titulo}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
								placeholder="Digite o título"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
								<FileText size={16} />
								Subtítulo
							</label>
							<input
								type="text"
								name="subtitulo"
								value={formData.subtitulo}
								onChange={handleChange}
								className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
								placeholder="Digite o subtítulo"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
								<Type size={16} />
								Corpo *
							</label>
							<textarea
								name="corpo"
								value={formData.corpo}
								onChange={handleChange}
								required
								rows={6}
								className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
								placeholder="Cole o texto aqui"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
								<Image size={16} />
								Fonte
							</label>
							<input
								type="text"
								name="fonte"
								value={formData.fonte}
								onChange={handleChange}
								className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
								placeholder="Ex: Instagram @usuario"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
							{loading ? (
								<>
									<Loader2
										className="animate-spin"
										size={20}
									/>
									Formatando...
								</>
							) : (
								<>
									<Sparkles size={20} />
									Formatar
								</>
							)}
						</button>
					</form>

					{/* Resultados */}
					{formatted && (
						<div className="mt-6 space-y-4 pt-6 border-t border-gray-700">
							<ResultField
								label="Título"
								value={formatted.titulo}
								onCopy={() =>
									copyToClipboard(
										formatted.titulo,
										"Título",
										"titulo",
									)
								}
								isCopied={copiedField === "titulo"}
							/>

							{formatted.subtitulo && (
								<ResultField
									label="Subtítulo"
									value={formatted.subtitulo}
									onCopy={() =>
										copyToClipboard(
											formatted.subtitulo,
											"Subtítulo",
											"subtitulo",
										)
									}
									isCopied={copiedField === "subtitulo"}
								/>
							)}

							<ResultField
								label="Corpo"
								value={formatted.corpo}
								onCopy={() =>
									copyToClipboard(
										formatted.corpo,
										"Corpo",
										"corpo",
									)
								}
								isCopied={copiedField === "corpo"}
								multiline
							/>

							{formatted.fonte && (
								<ResultField
									label="Fonte"
									value={formatted.fonte}
									onCopy={() =>
										copyToClipboard(
											formatted.fonte,
											"Fonte",
											"fonte",
										)
									}
									isCopied={copiedField === "fonte"}
								/>
							)}

							<ResultField
								label="Versão X"
								value={formatted.versaoX}
								onCopy={() =>
									copyToClipboard(
										formatted.versaoX,
										"Versão X",
										"versaoX",
									)
								}
								isCopied={copiedField === "versaoX"}
							/>
						</div>
					)}
				</div>
			</div>
		</>
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
