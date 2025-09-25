#pragma once

#include <chrono>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

enum class LicenseStatus {
    Active,
    Inactive,
    Expired,
    Pending,
    Revoked
};

enum class LicenseTier {
    Trial,
    Standard,
    Professional,
    Enterprise
};

struct Activation {
    std::string machineId;
    std::string activatedBy;
    std::chrono::system_clock::time_point activatedAt;
    std::optional<std::chrono::system_clock::time_point> lastHeartbeat;
};

struct License {
    std::string key;
    std::string productName;
    std::string ownerName;
    LicenseTier tier;
    LicenseStatus status;
    std::chrono::system_clock::time_point issuedAt;
    std::chrono::system_clock::time_point expiresAt;
    int activationLimit;
    std::vector<Activation> activations;
    std::string notes;
};

class LicenseRepository {
public:
    LicenseRepository();
    ~LicenseRepository() = default;

    std::vector<License> GetAll() const;
    std::optional<License> Get(const std::string& licenseKey) const;
    void Upsert(const License& license);

private:
    std::unordered_map<std::string, License> licenses_;
};

class ManageLicense {
public:
    ManageLicense();
    ~ManageLicense();

    bool ActivateMachine(const std::string& licenseKey, const Activation& activation);
    bool DeactivateMachine(const std::string& licenseKey, const std::string& machineId);

    std::vector<License> GetAllLicenses() const;
    std::optional<License> GetLicense(const std::string& licenseKey) const;

    bool CheckExpiration(const std::string& licenseKey) const;
    int GetRemainingDays(const std::string& licenseKey) const;
    LicenseStatus GetLicenseStatus(const std::string& licenseKey) const;

private:
    LicenseRepository repository_;

    void SeedMockData();
    LicenseStatus DetermineStatus(const License& license) const;
};

std::string Example();
