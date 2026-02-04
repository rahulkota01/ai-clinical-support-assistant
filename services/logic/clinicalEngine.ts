export function runClinicalEngine(input: {
  height?: number;
  weight?: number;
  vitals?: any;
  habits?: any;
  complaints?: string;
  drugs?: string[];
}) {
  const output: any = {};

  // BMI
  if (input.height && input.weight) {
    const h = input.height / 100;
    const bmi = input.weight / (h * h);
    output.bmi = {
      value: bmi.toFixed(1),
      category:
        bmi < 18.5 ? "Underweight" :
        bmi < 25 ? "Normal" :
        bmi < 30 ? "Overweight" : "Obese"
    };
  }

  // Drug explanation placeholder
  output.drugInfo = (input.drugs || []).map(drug => ({
    name: drug,
    uses: "—",
    sideEffects: "—",
    warnings: "—"
  }));

  // Drug interaction placeholder
  output.interactions = [];
  if (input.drugs && input.drugs.length > 1) {
    for (let i = 0; i < input.drugs.length; i++) {
      for (let j = i + 1; j < input.drugs.length; j++) {
        output.interactions.push({
          drugs: [input.drugs[i], input.drugs[j]],
          interaction: "—",
          severity: "—"
        });
      }
    }
  }

  // Suggestions if no drugs
  if (!input.drugs || input.drugs.length === 0) {
    output.suggestions = [
      "Symptomatic relief options may be considered",
      "Consult healthcare professional before use"
    ];
  }

  return output;
}
