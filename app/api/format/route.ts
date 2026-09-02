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

1. Corrigir APENAS erros gramaticais e ortográficos
2. Melhorar APENAS a clareza e fluidez do texto
3. Manter o tom jornalístico profissional
4. ⚠️ NÃO ALTERE NOMES, DATAS, LOCAIS, NÚMEROS ou FATOS
5. ⚠️ NÃO ADICIONE informações que não estão no original
6. ⚠️ NÃO REMOVA informações importantes
7. Retornar APENAS o JSON no formato especificado

IMPORTANTE: Retorne EXATAMENTE este JSON completo, sem cortar:
{
  "titulo": "título formatado",
  "subtitulo": "subtítulo formatado ou string vazia",
  "corpo": "corpo formatado",
  "fonte": "fonte formatada ou string vazia",
  "versaoX": "versão para Twitter/X com máximo 270 caracteres"
}

NÃO adicione texto fora do JSON. NÃO use markdown. JSON completo e válido.`,
				},
				{
					role: "user",
					content: `Formate este texto jornalístico SEM ALTERAR NOMES, DATAS, LOCAIS, NÚMEROS ou FATOS. Apenas corrija gramática e melhore a fluidez:


${textoCompleto}`,
				},
			],
			model: "openai/gpt-oss-120b",
			temperature: 0.2,
			max_tokens: 2000,
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

			// Tenta extrair JSON mesmo se estiver quebrado
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				try {
					const partialContent = JSON.parse(jsonMatch[0]);
					return NextResponse.json(partialContent);
				} catch (e) {
					// Ignora
				}
			}

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
