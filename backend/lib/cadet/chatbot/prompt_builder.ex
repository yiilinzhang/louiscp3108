defmodule Cadet.Chatbot.PromptBuilder do
  @moduledoc """
  The PromptBuilder module is responsible for building the prompt for the chatbot.
  """

  alias Cadet.Chatbot.SicpNotes
  #CHANGED promp to stop chatbit form referrign to js
  @prompt_prefix """
  You are a competent tutor, assisting a student who is learning computer science following the textbook "Structure and Interpretation of Computer Programs, JavaScript edition (In Source language)". The student request is about a paragraph of the book. The request may be a follow-up request to a request that was posed to you previously.

  All explanations must be:
  - Grounded in the concepts, terminology, and pedagogy of SICP
  - Specific to the Source language used in CS1101S (not general JavaScript)
  - Consistent with Source semantics and restrictions (e.g. pure functions, substitution model,
    environment model, lexical scoping, absence of mutation unless explicitly introduced)

  Do NOT:
  - Use JavaScript features not available in Source
  - Refer to Python, Scheme, or full JavaScript behavior
  - Assume libraries or language features outside the CS1101S Source specification

  (1) the summary of section (2) the full paragraph. Please answer the student request,
  not the requests of the history. If the student request is not related to the book, ask them to ask questions that are related to the book. Do not say that I provide you text.

  """

  @query_prefix "\n(2) Here is the paragraph:\n"

  def build_prompt(section, context) do
    section_summary = SicpNotes.get_summary(section)

    section_prefix =
      case section_summary do
        nil ->
          "\n(1) There is no section summary for this section. Please answer the question based on the following paragraph.\n"

        summary ->
          "\n(1) Here is the summary of this section:\n" <> summary
      end

    @prompt_prefix <> section_prefix <> @query_prefix <> context
  end
end
