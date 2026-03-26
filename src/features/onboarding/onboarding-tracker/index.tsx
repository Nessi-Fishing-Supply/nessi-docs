'use client';

import Link from 'next/link';
import type { OnboardingStep, SellerPrecondition } from '@/data/onboarding';
import styles from './onboarding-tracker.module.scss';

interface OnboardingTrackerProps {
  steps: OnboardingStep[];
  sellerPreconditions: SellerPrecondition[];
}

export function OnboardingTracker({ steps, sellerPreconditions }: OnboardingTrackerProps) {
  const requiredCount = steps.filter((s) => s.required).length;
  const optionalCount = steps.filter((s) => !s.required).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Onboarding Flow</h1>
        <p className={styles.subtitle}>
          {steps.length} steps &middot; {requiredCount} required &middot; {optionalCount} optional
        </p>
      </div>

      <div className={styles.timeline}>
        {steps.map((step, index) => (
          <div key={step.id} className={styles.stepRow}>
            <div className={styles.stepConnector}>
              <div className={`${styles.dot} ${step.required ? styles.dotRequired : styles.dotOptional}`} />
              {index < steps.length - 1 && <div className={styles.line} />}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepHeader}>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={`${styles.badge} ${step.required ? styles.badgeRequired : styles.badgeOptional}`}>
                  {step.required ? 'required' : 'optional'}
                </span>
              </div>
              <p className={styles.stepDescription}>{step.description}</p>
              <code className={styles.fieldRef}>{step.field}</code>
              {step.gates && (
                <div className={styles.gatesBlock}>
                  <span className={styles.gatesLabel}>Gates</span>
                  <span className={styles.gatesText}>{step.gates}</span>
                </div>
              )}
              {(step.relatedJourney || step.relatedApi) && (
                <div className={styles.links}>
                  {step.relatedJourney && (
                    <Link href={step.relatedJourney.href} className={styles.linkJourney}>
                      {step.relatedJourney.label}
                    </Link>
                  )}
                  {step.relatedApi && (
                    <Link href={step.relatedApi.href} className={styles.linkApi}>
                      {step.relatedApi.label}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.preconditionsSection}>
        <h2 className={styles.preconditionsTitle}>Seller Preconditions</h2>
        <p className={styles.preconditionsSubtitle}>
          All three must be satisfied before a member can publish listings as a seller.
        </p>
        <div className={styles.preconditionsList}>
          {sellerPreconditions.map((precondition, index) => (
            <div key={precondition.id} className={styles.preconditionCard}>
              <div className={styles.preconditionNumber}>{index + 1}</div>
              <div className={styles.preconditionBody}>
                <div className={styles.preconditionLabel}>{precondition.label}</div>
                <p className={styles.preconditionDescription}>{precondition.description}</p>
                <code className={styles.fieldRef}>{precondition.field}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
