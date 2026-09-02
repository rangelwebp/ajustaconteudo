import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
	apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
	try {
		const { titulo, subtitulo, corpo, fonte } = await request.json();

		// Validação básica
		if (!titulo || !corpo) {
			return NextResponse.json(
				{ error: "Título e corpo são obrigatórios" },
				{ status: 400 },
			);
		}

		// Monta o texto completo
		const textoCompleto = `
Título: ${titulo}
${subtitulo ? `Subtítulo: ${subtitulo}` : ""}
Corpo: ${corpo}
${fonte ? `Fonte: ${fonte}` : ""}
    `.trim();

		// Chama a Groq com modelo disponível
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: "system",
					content: `Você é um editor jornalístico experiente em português do Brasil. Sua tarefa é:
1. Corrigir erros gramaticais e ortográficos
2. Melhorar a clareza e fluidez do texto para compreensão do leitor
3. Manter o tom jornalístico profissional
4. Não alterar o significado original do texto
5. Retornar APENAS o JSON no formato especificado

IMPORTANTE: Retorne EXATAMENTE este JSON:
{
  "titulo": "título formatado",
  "subtitulo": "subtítulo formatado ou string vazia",
  "corpo": "corpo formatado",
  "fonte": "fonte formatada ou string vazia",
  "versaoX": "versão para Twitter/X com máximo 270 caracteres"
}`,
				},
				{
					role: "user",
					content: `Formate este texto jornalístico:

${textoCompleto}`,
				},
			],
			model: "openai/gpt-oss-120b", // ✅ Modelo da sua lista
			temperature: 0.3,
			max_tokens: 1000,
		});

		let content = chatCompletion.choices[0]?.message?.content || "";

		// Limpar caso venha com markdown
		content = content
			.replace(/^```json\n?/g, "")
			.replace(/\n?```$/g, "")
			.trim();

		// Parse do JSON
		try {
			const formattedContent = JSON.parse(content);
			return NextResponse.json(formattedContent);
		} catch (parseError) {
			console.error("Erro ao parsear JSON:", parseError);
			console.error("Conteúdo recebido:", content);
			return NextResponse.json(
				{ error: "Erro ao processar resposta da IA. Tente novamente." },
				{ status: 500 },
			);
		}
	} catch (error: any) {
		console.error("Erro geral:", error);

		if (error.status === 401) {
			return NextResponse.json(
				{ error: "API Key inválida. Verifique seu GROQ_API_KEY" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{ error: error.message || "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
