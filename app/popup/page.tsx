// app/popup/page.tsx

"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";

interface FormattedContent {
	titulo: string;
	subtitulo: string;
	corpo: string;
	fonte: string;
	versaoX: string;
}

const FIELD_COLOR = {
	titulo: "#C99A3C",
	subtitulo: "#8FA6C7",
	corpo: "#B9AF98",
	fonte: "#7A9B7E",
	versaoX: "#BE6A4E",
} as const;

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

	const copyToClipboard = async (text: string, fieldName: string, fieldKey: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldKey);
			toast.success(`${fieldName} copiado!`);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			toast.error("Erro ao copiar");
		}
	};

	const rows = formatted
		? [
				{ key: "titulo", label: "Título", value: formatted.titulo, serif: true },
				{ key: "subtitulo", label: "Subtítulo", value: formatted.subtitulo, serif: true },
				{ key: "corpo", label: "Corpo", value: formatted.corpo, multiline: true },
				{ key: "fonte", label: "Fonte", value: formatted.fonte },
				{ key: "versaoX", label: "Versão X", value: formatted.versaoX, counter: true },
			].filter((r) => r.value)
		: [];

	return (
		<>
			<Toaster
				position="top-center"
				richColors
				theme="dark"
				toastOptions={{
					style: { background: "#1F1B14", border: "1px solid #35301F", color: "#EDE6D6" },
				}}
			/>

			<div className="min-h-screen bg-[#17140F] p-5">
				<div className="max-w-lg mx-auto">
					<h1 className="font-serif text-xl text-[#EDE6D6] mb-5">AjustaConteúdo</h1>

					<form onSubmit={handleSubmit} className="space-y-4">
						<Field
							label="Título"
							required
							name="titulo"
							value={formData.titulo}
							onChange={handleChange}
							placeholder="Digite o título"
							dot={FIELD_COLOR.titulo}
						/>
						<Field
							label="Subtítulo"
							name="subtitulo"
							value={formData.subtitulo}
							onChange={handleChange}
							placeholder="Digite o subtítulo"
							dot={FIELD_COLOR.subtitulo}
						/>
						<Field
							label="Corpo"
							required
							textarea
							rows={6}
							name="corpo"
							value={formData.corpo}
							onChange={handleChange}
							placeholder="Cole o texto aqui"
							dot={FIELD_COLOR.corpo}
						/>
						<Field
							label="Fonte"
							name="fonte"
							value={formData.fonte}
							onChange={handleChange}
							placeholder="Ex: Instagram @usuario"
							dot={FIELD_COLOR.fonte}
						/>

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
					</form>

					{formatted && (
						<div className="mt-6 bg-[#1B1712] border border-[#35301F] rounded-xl divide-y divide-[#2A251C]">
							{rows.map((row) => (
								<div key={row.key} className="px-5 py-4">
									<div className="flex justify-between items-center mb-1.5">
										<span className="flex items-center gap-2 text-xs text-[#9C917A]">
											<span
												className="w-1.5 h-1.5 rounded-full shrink-0"
												style={{ backgroundColor: (FIELD_COLOR as any)[row.key] }}
											/>
											{row.label}
											{row.counter && (
												<span className="tabular-nums text-[#6B6350]">
													· {row.value.length} caract.
												</span>
											)}
										</span>
										<button
											onClick={() => copyToClipboard(row.value, row.label, row.key)}
											className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
												copiedField === row.key
													? "bg-[#7A9B7E]/20 text-[#7A9B7E]"
													: "text-[#9C917A] hover:text-[#EDE6D6] hover:bg-[#262019]"
											}`}>
											{copiedField === row.key ? <Check size={13} /> : <Copy size={13} />}
											{copiedField === row.key ? "Copiado" : "Copiar"}
										</button>
									</div>
									<p
										className={`text-[#EDE6D6] ${row.serif ? "font-serif text-lg" : "text-sm"} ${
											row.multiline ? "whitespace-pre-wrap leading-relaxed" : ""
										}`}>
										{row.value}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</>
	);
}

function Field({ label, name, value, onChange, placeholder, dot, required, textarea, rows }: any) {
	const shared =
		"w-full px-3.5 py-2.5 bg-[#17140F] border border-[#35301F] rounded-lg text-[#EDE6D6] placeholder-[#6B6350] focus:outline-none focus:border-[#C99A3C]/60 focus:ring-1 focus:ring-[#C99A3C]/40 transition-colors";

	return (
		<div>
			<label className="flex items-center gap-2 text-sm text-[#9C917A] mb-1.5">
				<span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
				{label}
				{required && <span className="text-[#BE6A4E]">*</span>}
			</label>
			{textarea ? (
				<textarea
					name={name}
					value={value}
					onChange={onChange}
					required={required}
					rows={rows}
					placeholder={placeholder}
					className={`${shared} resize-y`}
				/>
			) : (
				<input
					type="text"
					name={name}
					value={value}
					onChange={onChange}
					required={required}
					placeholder={placeholder}
					className={shared}
				/>
			)}
		</div>
	);
}
