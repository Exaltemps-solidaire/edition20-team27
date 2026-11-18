import { describe, expect, it } from "vitest";
import { identifiantParticipant, nouvelUuid } from "./api";
import { PERSONAS } from "./personas";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("identifiant de la participante", () => {
  it("génère un UUID v4 même sans crypto.randomUUID (page servie en HTTP)", () => {
    const sansRandomUuid = { getRandomValues: crypto.getRandomValues.bind(crypto) } as Pick<Crypto, "getRandomValues">;
    expect(nouvelUuid(sansRandomUuid)).toMatch(UUID_V4);
  });

  it("garde le même identifiant de BURN'ette sur cet appareil (une Camille par testeur)", () => {
    localStorage.setItem("filactiv.persona", "camille");
    localStorage.removeItem("filactiv.participant");
    const id = identifiantParticipant();
    expect(id).toMatch(UUID_V4);
    expect(id).not.toBe(PERSONAS[0].participantId);
    expect(identifiantParticipant()).toBe(id);
  });
});
