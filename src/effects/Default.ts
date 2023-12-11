import { AudioEffect, AudioEffectFactory } from '../core/AudioEffect';
import { AudioFileResolver } from '../core/AudioFile';
import { JSONObject, JSONValue } from '../core/Common';
import { Compressor } from './Compressor';
import { Delay } from './Delay';
import { EQ } from './EQ';
import { Reverb } from './Reverb';

export class Registry {
  private static readonly factories: Map<string, AudioEffectFactory> = new Map();

  static register(id: string, factory: AudioEffectFactory): void {
    if (Registry.factories.has(id)) {
      throw new Error(`Factory for ${id} already registered`);
    }
    Registry.factories.set(id, factory);
  }

  static get(id: string): AudioEffectFactory {
    const factory = Registry.factories.get(id);
    if (!factory) {
      throw new Error(`No factory registered for ${id}`);
    }
    return factory;
  }

  public static rehydrate(json: JSONValue, resolver: AudioFileResolver): AudioEffect {
    if (typeof json !== 'object' || json === null) {
      throw new Error('Expected object');
    }

    const obj = json as JSONObject;
    const id = obj.id as string;
    const factory = Registry.get(id);
    return factory.rehydrate(obj, resolver);
  }
}

class DelayFactory implements AudioEffectFactory {
  instantiate(): AudioEffect {
    return new Delay();
  }
  rehydrate(json: JSONObject, resolver: AudioFileResolver): AudioEffect {
    return Delay.fromJson(json, resolver);
  }
}

class EQFactory implements AudioEffectFactory {
  instantiate(): AudioEffect {
    return new EQ();
  }
  rehydrate(json: JSONObject, resolver: AudioFileResolver): AudioEffect {
    return EQ.fromJson(json, resolver);
  }
}

class CompressorFactory implements AudioEffectFactory {
  instantiate(): AudioEffect {
    return new Compressor();
  }
  rehydrate(json: JSONObject, resolver: AudioFileResolver): AudioEffect {
    return Compressor.fromJson(json, resolver);
  }
}

class ReverbFactory implements AudioEffectFactory {
  instantiate(): AudioEffect {
    return new Reverb();
  }
  rehydrate(json: JSONObject, resolver: AudioFileResolver): AudioEffect {
    return Reverb.fromJson(json, resolver);
  }
}

Registry.register(Delay.ID, new DelayFactory());
Registry.register(EQ.ID, new EQFactory());
Registry.register(Compressor.ID, new CompressorFactory());
Registry.register(Reverb.ID, new ReverbFactory());
