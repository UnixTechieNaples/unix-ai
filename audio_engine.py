# scripts/audio_engine.py
from pydub import AudioSegment
from pydub.effects import normalize

def create_stacchetto(music_path: str, voice_path: str, output_path: str):
    # Caricamento file
    music = AudioSegment.from_file(music_path)
    voice = AudioSegment.from_file(voice_path)

    # Normalizzazione volumi
    music = normalize(music) - 6  # abbassa la musica di 6dB
    voice = normalize(voice)

    # Crossfade e overlay
    # Sovrappone la voce all'inizio della musica con un leggero offset
    combined = music.overlay(voice, position=500) 

    # Export del file finale MP3
    combined.export(output_path, format="mp3")
    print(f"Stacchetto generato con successo: {output_path}")

if __name__ == "__main__":
    # Esempio di esecuzione manuale/backend
    create_stacchetto("jingle.wav", "voice_cloned.wav", "stacchetto_finale.mp3")