import { Injectable, BadRequestException } from '@nestjs/common';
import { EscrowStatus } from '@prisma/client';

@Injectable()
export class EscrowState {
  private readonly VALID_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
    PENDING:     ['PARTIAL', 'FUNDED', 'OVERFUNDED', 'FROZEN'],
    PARTIAL:     ['PARTIAL', 'FUNDED', 'OVERFUNDED', 'FROZEN'],
    FUNDED:      ['OVERFUNDED', 'IN_PROGRESS', 'COMPLETED', 'DISBURSED', 'FROZEN'],
    OVERFUNDED:  ['IN_PROGRESS', 'COMPLETED', 'DISBURSED', 'FROZEN', 'REFUNDED'],
    IN_PROGRESS: ['COMPLETED', 'DISBURSED', 'FROZEN'],
    COMPLETED:   ['DISBURSED', 'FROZEN'],
    DISBURSED:   [],
    REFUNDED:    [],
    FROZEN:      [],
  };

  transition(current: EscrowStatus, next: EscrowStatus): void {
    if (!this.VALID_TRANSITIONS[current].includes(next)) {
      throw new BadRequestException(`Invalid escrow transition: ${current} → ${next}`);
    }
  }
}
