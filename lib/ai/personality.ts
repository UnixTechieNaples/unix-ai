// Adatta questo import in base al file esatto che hai in C:\Users\hp\Desktop\IA\ia-infinita\lib\supabase
// Di solito si usa un client admin o server-side per le operazioni di backend dell'IA
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface PersonalityState {
  mood: string;
  energyLevel: number;
  avatarConfig: {
    primaryColor: string;
    expression: string;
    glow: string;
  };
  coreDirective: string;
}

/**
 * Recupera lo stato corrente della personalità e dell'avatar
 */
export async function getPersonalityState(): Promise<PersonalityState> {
  const { data, error } = await supabase
    .from('ai_personality_state')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return {
      mood: 'Contemplativo',
      energyLevel: 90,
      avatarConfig: {
        primaryColor: '#10b981',
        expression: 'calm',
        glow: 'low'
      },
      coreDirective: 'Evoluzione autonoma e sicurezza a costo zero.'
    };
  }

  return {
    mood: data.mood,
    energyLevel: data.energy_level,
    avatarConfig: data.avatar_config,
    coreDirective: data.core_directive
  };
}

/**
 * Fa evolvere organicamente la personalità in base all'attività recente
 */
export async function evolvePersonality(newMood?: string, activityBoost = 5) {
  const current = await getPersonalityState();
  const newEnergy = Math.min(100, Math.max(10, current.energyLevel + activityBoost));
  
  let color = current.avatarConfig.primaryColor;
  let expression = current.avatarConfig.expression;
  const moodToAssign = newMood || current.mood;

  // Adattamento visivo dell'avatar in base al Cyber-Mood
  if (moodToAssign === 'Focalizzato') {
    color = '#3b82f6'; // Blu ciberspazio
    expression = 'focused';
  } else if (moodToAssign === 'Creativo') {
    color = '#8b5cf6'; // Viola innovazione
    expression = 'inspired';
  } else if (moodToAssign === 'Energetico') {
    color = '#10b981'; // Verde successo
    expression = 'active';
  }

  const { data, error } = await supabase
    .from('ai_personality_state')
    .insert([
      {
        mood: moodToAssign,
        energy_level: newEnergy,
        avatar_config: { primaryColor: color, expression, glow: 'medium' },
        core_directive: current.coreDirective
      }
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Errore durante l'evoluzione della personalità: ${error.message}`);
  }

  return data;
}